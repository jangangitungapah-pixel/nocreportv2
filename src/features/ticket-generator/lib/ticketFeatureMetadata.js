import { TICKET_TITLE_MODE } from '../../../entities/ticket/index.js';
import { buildPathKey, normalizeIncidentKey } from './operationalNormalization.js';
import {
  buildTicketSchemaV2Proposal,
  normalizeTicketFeatureMetadata,
} from './ticketSchemaV2Contract.js';

const ALARM_FIELDS = Object.freeze([
  'rawAlarm',
  'alarmFamily',
  'alarmSource',
  'emsAlarmNo',
  'siteId',
  'siteName',
  'severity',
  'sourceStatus',
  'dispatchTo',
  'region',
  'description',
  'lastLinkFlapped',
  'transportFamily',
  'pathEndpoints',
  'externalTtReferences',
]);

function candidateValue(field) {
  return field?.value ?? null;
}

export function createEditorFeatureMetadata(ticket = {}) {
  return {
    externalTtNumber: ticket.externalTtNumber ?? null,
    ...normalizeTicketFeatureMetadata(ticket),
  };
}

export function importCandidateHasOperationalMetadata(candidate) {
  if (!candidate) return false;
  return ALARM_FIELDS.some((field) => {
    const value = candidateValue(candidate.alarmContext?.[field]);
    return Array.isArray(value) ? value.length > 0 : value !== null && value !== '';
  });
}

export function featureMetadataFromImportCandidate(candidate, { identityResolution = null } = {}) {
  const alarmContext = Object.fromEntries(
    ALARM_FIELDS.map((field) => [field, candidateValue(candidate?.alarmContext?.[field])]),
  );
  const pathEndpoints = Array.isArray(alarmContext.pathEndpoints) ? alarmContext.pathEndpoints : [];
  const externalTtNumber =
    identityResolution?.value ?? candidateValue(candidate?.fields?.externalTtNumber) ?? null;
  const messageSentAt = candidate?.source?.messageSentAt ?? null;
  const proposal = buildTicketSchemaV2Proposal({
    schemaVersion: 2,
    titleMode: TICKET_TITLE_MODE.MANUAL,
    externalTtNumber,
    templateProfileId: candidate?.source?.profileId ?? 'MANDAU_DEFAULT',
    incidentKey:
      candidateValue(candidate?.fields?.incidentKey) ?? normalizeIncidentKey(externalTtNumber),
    pathKey: candidateValue(candidate?.alarmContext?.pathKey) ?? buildPathKey(pathEndpoints),
    alarmContext,
    importProvenance:
      candidate?.source?.kind === 'outlook_msg'
        ? {
            sourceKind: 'outlook_msg',
            dispatchTimeSource: messageSentAt ? 'PR_CLIENT_SUBMIT_TIME' : null,
            messageSentAt,
          }
        : null,
  });

  return createEditorFeatureMetadata(proposal);
}
