import {
  createCandidateField,
  createImportCandidate,
  detectCandidateValueConflict,
} from './importCandidate.js';
import { parseOperationalEmailBody } from './emailBodyParser.js';
import { extractEmailExternalTt, parseEmailSubject } from './emailSubjectParser.js';
import { htmlToSafePlainText } from './htmlToSafePlainText.js';
import { formatInstantForTimeZone, normalizeMessageSentInstant } from './messageTime.js';
import {
  buildPathKey,
  normalizeAlarm,
  normalizeExternalTtReference,
  normalizeIncidentKey,
  normalizeOperationalText,
} from './operationalNormalization.js';
import { requireTemplateProfile } from './templateProfiles.js';

const SOURCE_PRIORITY = Object.freeze({
  message_metadata: 0,
  body: 1,
  subject: 2,
  filename: 3,
  inference: 4,
});

function usableValue(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return Boolean(normalizeOperationalText(value));
  return true;
}

function candidate(value, source, confidence, rawValue = value) {
  return createCandidateField({
    value,
    rawValue,
    source,
    confidence,
    selected: usableValue(value),
  });
}

function emptyCandidate() {
  return createCandidateField({ selected: false });
}

function chooseCandidate(candidates) {
  const usable = candidates.filter((entry) => entry && usableValue(entry.value));
  if (!usable.length) return emptyCandidate();
  return [...usable].sort(
    (left, right) => SOURCE_PRIORITY[left.source] - SOURCE_PRIORITY[right.source],
  )[0];
}

function normalizeTtConflict(value) {
  return normalizeIncidentKey(value) ?? normalizeExternalTtReference(value) ?? '';
}

function uniqueReferences(values) {
  return values
    .map(normalizeExternalTtReference)
    .filter(Boolean)
    .filter((entry, index, entries) => entries.indexOf(entry) === index);
}

function conflictWithSeverity(conflict, severity = 'warning') {
  return conflict ? { ...conflict, severity } : null;
}

export function parseDecodedEmailImport(
  message,
  { profileId = 'MANDAU_DEFAULT', sourceName = null } = {},
) {
  const profile = requireTemplateProfile(profileId);
  const subject = normalizeOperationalText(message?.subject);
  const bodyText = String(message?.body ?? '').trim()
    ? String(message.body)
    : htmlToSafePlainText(message?.htmlBody ?? '');
  const subjectData = parseEmailSubject(subject);
  const bodyData = parseOperationalEmailBody(bodyText);
  const filenameTt = extractEmailExternalTt(sourceName);

  const bodyTtCandidate = bodyData.primaryTt
    ? candidate(bodyData.primaryTt, 'body', 'exact')
    : null;
  const subjectTtCandidate = subjectData.externalTtNumber
    ? candidate(subjectData.externalTtNumber, 'subject', 'strong')
    : null;
  const filenameTtCandidate = filenameTt ? candidate(filenameTt, 'filename', 'weak') : null;
  const externalTtCandidates = [bodyTtCandidate, subjectTtCandidate, filenameTtCandidate].filter(
    Boolean,
  );
  const externalTtNumber = chooseCandidate(externalTtCandidates);
  const incidentKeyValue = normalizeIncidentKey(externalTtNumber.value);

  const sentInstant = normalizeMessageSentInstant(message?.clientSubmitTime);
  const dispatchAt = sentInstant ? formatInstantForTimeZone(sentInstant, profile.timezone) : null;

  const severityCandidates = [
    bodyData.severity ? candidate(bodyData.severity, 'body', 'exact') : null,
    subjectData.severity ? candidate(subjectData.severity, 'subject', 'strong') : null,
  ].filter(Boolean);
  const statusCandidates = [
    bodyData.sourceStatus ? candidate(bodyData.sourceStatus, 'body', 'exact') : null,
    subjectData.sourceStatus ? candidate(subjectData.sourceStatus, 'subject', 'strong') : null,
  ].filter(Boolean);

  const alarm = normalizeAlarm(bodyData.alarm);
  const inferredLinkDown =
    !alarm.rawAlarm && subjectData.condition === 'DOWN' && subjectData.pathEndpoints.length >= 2;
  const alarmFamily = alarm.alarmFamily ?? (inferredLinkDown ? 'LINK_DOWN' : null);
  const pathKey = subjectData.pathKey ?? buildPathKey(subjectData.pathEndpoints);

  const conflicts = [
    conflictWithSeverity(
      detectCandidateValueConflict('externalTtNumber', externalTtCandidates, normalizeTtConflict),
      'blocking',
    ),
    conflictWithSeverity(detectCandidateValueConflict('severity', severityCandidates)),
    conflictWithSeverity(detectCandidateValueConflict('sourceStatus', statusCandidates)),
  ].filter(Boolean);

  const warnings = [];
  if (!sentInstant) {
    warnings.push('Email Sent Time was not available; Dispatch Time needs review.');
  }
  if (bodyData.occurAtRaw && !bodyData.occurAt) {
    warnings.push('Occur Time was found but its date format was not recognized.');
  }
  if (!subject) warnings.push('Email subject was not available.');
  if (conflicts.some((entry) => entry.severity === 'blocking')) {
    warnings.push('Imported email contains a blocking identity conflict that needs review.');
  }

  const externalTtReferences = uniqueReferences([
    ...bodyData.externalTtReferences,
    subjectData.externalTtNumber,
    filenameTt,
  ]);

  const resolvedSeverity = chooseCandidate(severityCandidates);
  const resolvedStatus = chooseCandidate(statusCandidates);

  const imported = createImportCandidate({
    source: {
      kind: 'outlook_msg',
      profileId,
      parserVersion: 1,
      sourceName,
      subject: subject || null,
      messageSentAt: sentInstant,
    },
    fields: {
      title: subject ? candidate(subject, 'subject', 'strong') : emptyCandidate(),
      externalTtNumber,
      incidentKey: incidentKeyValue
        ? candidate(incidentKeyValue, 'inference', 'strong', externalTtNumber.value)
        : emptyCandidate(),
      occurAt: bodyData.occurAt
        ? candidate(bodyData.occurAt, 'body', 'exact', bodyData.occurAtRaw)
        : emptyCandidate(),
      dispatchAt: dispatchAt
        ? candidate(dispatchAt, 'message_metadata', 'exact', sentInstant)
        : emptyCandidate(),
    },
    alarmContext: {
      rawAlarm: alarm.rawAlarm ? candidate(alarm.rawAlarm, 'body', 'exact') : emptyCandidate(),
      alarmFamily: alarmFamily
        ? candidate(
            alarmFamily,
            alarm.alarmFamily ? 'inference' : 'subject',
            alarm.alarmFamily ? 'strong' : 'weak',
            alarm.rawAlarm || subjectData.condition,
          )
        : emptyCandidate(),
      alarmSource: bodyData.alarmSource
        ? candidate(bodyData.alarmSource, 'body', 'exact')
        : emptyCandidate(),
      emsAlarmNo: bodyData.emsAlarmNo
        ? candidate(bodyData.emsAlarmNo, 'body', 'exact')
        : emptyCandidate(),
      siteId: bodyData.siteId ? candidate(bodyData.siteId, 'body', 'exact') : emptyCandidate(),
      siteName: bodyData.siteName
        ? candidate(bodyData.siteName, 'body', 'exact')
        : emptyCandidate(),
      severity: resolvedSeverity,
      sourceStatus: resolvedStatus,
      dispatchTo: bodyData.dispatchTo
        ? candidate(bodyData.dispatchTo, 'body', 'exact')
        : emptyCandidate(),
      region: bodyData.region ? candidate(bodyData.region, 'body', 'exact') : emptyCandidate(),
      description: bodyData.description
        ? candidate(bodyData.description, 'body', 'exact')
        : emptyCandidate(),
      lastLinkFlapped: bodyData.lastLinkFlapped
        ? candidate(bodyData.lastLinkFlapped, 'body', 'exact')
        : emptyCandidate(),
      transportFamily: subjectData.transportFamily
        ? candidate(subjectData.transportFamily, 'subject', 'strong')
        : emptyCandidate(),
      pathEndpoints: subjectData.pathEndpoints.length
        ? candidate(subjectData.pathEndpoints, 'subject', 'strong')
        : emptyCandidate(),
      pathKey: pathKey
        ? candidate(pathKey, 'inference', 'strong', subjectData.pathEndpoints)
        : emptyCandidate(),
      externalTtReferences: externalTtReferences.length
        ? candidate(externalTtReferences, 'inference', 'strong')
        : emptyCandidate(),
    },
    warnings,
    conflicts,
    stats: {
      adapter: 'decoded_email',
      subjectFormat: subjectData.format,
      bodyLabelCount: bodyData.detectedLabels.length,
      externalTtReferenceCount: externalTtReferences.length,
      pathEndpointCount: subjectData.pathEndpoints.length,
      hasMessageSentTime: Boolean(sentInstant),
    },
  });

  return imported;
}
