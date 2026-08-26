import { validateRunningRequirements } from '../../../entities/ticket/index.js';
import { validateTicketForm } from '../schemas/ticketFormSchema.js';
import { deriveTimeIntelligence } from './timeIntelligence.js';

export const VALIDATION_SEVERITY = Object.freeze({
  BLOCKING: 'blocking',
  WARNING: 'warning',
  INFO: 'info',
});

const EMAIL_SENT_TIME_WARNING = 'Email Sent Time was not available; Dispatch Time needs review.';

function finding({ code, severity, message, field = null, source = 'derived', meta = null }) {
  return {
    id: `${severity}:${code}:${field ?? 'general'}`,
    code,
    severity,
    message,
    field,
    source,
    meta,
  };
}

function normalizeFieldPath(path) {
  if (!Array.isArray(path) || path.length === 0) return null;
  return String(path[0]);
}

function formFindings(formValues) {
  if (!formValues) return [];
  const result = validateTicketForm(formValues);
  if (result.success) return [];

  return result.error.issues.map((issue) =>
    finding({
      code: `FORM_${String(issue.code).toUpperCase()}`,
      severity: VALIDATION_SEVERITY.BLOCKING,
      message: issue.message,
      field: normalizeFieldPath(issue.path),
      source: 'zod',
    }),
  );
}

function lifecycleFindings(ticket) {
  return validateRunningRequirements(ticket).errors.map((issue) =>
    finding({
      code: `RUNNING_${issue.code}_${String(issue.field).toUpperCase()}`,
      severity: VALIDATION_SEVERITY.BLOCKING,
      message: issue.message,
      field: issue.field,
      source: 'lifecycle',
    }),
  );
}

function importFindings(
  importCandidate,
  { resolvedPrimaryIdentity = false, dispatchReviewed = false } = {},
) {
  if (!importCandidate) return [];
  const findings = [];
  const conflicts = Array.isArray(importCandidate.conflicts) ? importCandidate.conflicts : [];
  const warnings = Array.isArray(importCandidate.warnings) ? importCandidate.warnings : [];

  for (const conflict of conflicts) {
    const primaryIdentity =
      conflict?.severity === 'blocking' && conflict?.field === 'externalTtNumber';
    if (primaryIdentity && resolvedPrimaryIdentity) continue;

    findings.push(
      finding({
        code: primaryIdentity ? 'PRIMARY_TT_CONFLICT' : 'IMPORT_CONFLICT',
        severity: primaryIdentity ? VALIDATION_SEVERITY.BLOCKING : VALIDATION_SEVERITY.WARNING,
        message: primaryIdentity
          ? 'Primary TT candidates conflict and need explicit review.'
          : `Imported ${conflict?.field ?? 'source'} values conflict and need review.`,
        field: conflict?.field === 'externalTtNumber' ? 'title' : (conflict?.field ?? null),
        source: 'import',
        meta: conflict,
      }),
    );
  }

  if (!dispatchReviewed && warnings.includes(EMAIL_SENT_TIME_WARNING)) {
    findings.push(
      finding({
        code: 'EMAIL_SENT_TIME_UNAVAILABLE',
        severity: VALIDATION_SEVERITY.WARNING,
        message: EMAIL_SENT_TIME_WARNING,
        field: 'dispatchAt',
        source: 'import',
      }),
    );
  }

  return findings;
}

function timeFindings(ticket, time) {
  const findings = [];

  if (Number.isFinite(time.dispatchDelayMs) && time.dispatchDelayMs < 0) {
    findings.push(
      finding({
        code: 'DISPATCH_BEFORE_OCCUR',
        severity: VALIDATION_SEVERITY.BLOCKING,
        message: 'Dispatch Time cannot be earlier than Occur Time.',
        field: 'dispatchAt',
        source: 'time',
      }),
    );
  }

  if (time.occurAt && time.resolvedAt && time.resolvedAt.getTime() < time.occurAt.getTime()) {
    findings.push(
      finding({
        code: 'RESOLVED_BEFORE_OCCUR',
        severity: VALIDATION_SEVERITY.BLOCKING,
        message: 'Resolved time cannot be earlier than Occur Time.',
        field: 'occurAt',
        source: 'time',
      }),
    );
  }

  if (!time.latestProgressAt) {
    findings.push(
      finding({
        code: 'NO_PROGRESS',
        severity: VALIDATION_SEVERITY.WARNING,
        message: 'No Progress update has been recorded yet.',
        field: 'progress',
        source: 'time',
      }),
    );
  }

  return findings;
}

function completenessFindings(ticket, { duplicateCandidates = [] } = {}) {
  const findings = [];

  if (
    ticket?.importProvenance?.sourceKind === 'outlook_msg' &&
    !ticket?.importProvenance?.messageSentAt &&
    !ticket?.dispatchAt
  ) {
    findings.push(
      finding({
        code: 'EMAIL_SENT_TIME_UNAVAILABLE',
        severity: VALIDATION_SEVERITY.WARNING,
        message: EMAIL_SENT_TIME_WARNING,
        field: 'dispatchAt',
        source: 'import',
      }),
    );
  }

  if (ticket?.coordinate?.source === 'ocr' && ticket.coordinate.verified === false) {
    findings.push(
      finding({
        code: 'OCR_COORDINATE_UNVERIFIED',
        severity: VALIDATION_SEVERITY.WARNING,
        message: 'OCR coordinate has not been verified.',
        field: 'latitude',
      }),
    );
  }

  if (!ticket?.pic?.trim()) {
    findings.push(
      finding({
        code: 'PIC_EMPTY',
        severity: VALIDATION_SEVERITY.WARNING,
        message: 'PIC is empty.',
        field: 'pic',
      }),
    );
  }

  if (!ticket?.rootcause?.trim()) {
    findings.push(
      finding({
        code: 'ROOTCAUSE_EMPTY',
        severity: VALIDATION_SEVERITY.WARNING,
        message: 'Rootcause is empty.',
        field: 'rootcause',
      }),
    );
  }

  if (Array.isArray(duplicateCandidates) && duplicateCandidates.length > 0) {
    findings.push(
      finding({
        code: 'SUSPECTED_DUPLICATE',
        severity: VALIDATION_SEVERITY.WARNING,
        message: 'A possible related or duplicate incident needs review.',
        source: 'duplicate-detection',
        meta: { count: duplicateCandidates.length },
      }),
    );
  }

  if (!ticket?.coordinate) {
    findings.push(
      finding({
        code: 'NO_COORDINATE',
        severity: VALIDATION_SEVERITY.INFO,
        message: 'No coordinate is recorded.',
        field: 'latitude',
      }),
    );
  }

  if (!Array.isArray(ticket?.impactList) || ticket.impactList.length === 0) {
    findings.push(
      finding({
        code: 'IMPACT_EMPTY',
        severity: VALIDATION_SEVERITY.INFO,
        message: 'Impact List is empty.',
        field: 'impactList',
      }),
    );
  }

  if (
    ticket?.importProvenance?.sourceKind === 'outlook_msg' &&
    !ticket?.alarmContext?.description?.trim()
  ) {
    findings.push(
      finding({
        code: 'EMAIL_DESCRIPTION_UNAVAILABLE',
        severity: VALIDATION_SEVERITY.INFO,
        message: 'Optional email Description is unavailable.',
        field: 'description',
        source: 'import',
      }),
    );
  }

  return findings;
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((item) => {
    const key = `${item.code}:${item.field ?? ''}:${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function deriveReportValidation(
  ticket,
  {
    formValues = null,
    importCandidate = null,
    resolvedPrimaryIdentity = false,
    duplicateCandidates = [],
    now = new Date(),
    timezone = 'Asia/Jakarta',
  } = {},
) {
  const time = deriveTimeIntelligence(ticket, { now, timezone });
  const findings = dedupeFindings([
    ...formFindings(formValues),
    ...lifecycleFindings(ticket),
    ...importFindings(importCandidate, {
      resolvedPrimaryIdentity,
      dispatchReviewed: Boolean(ticket?.dispatchAt),
    }),
    ...timeFindings(ticket, time),
    ...completenessFindings(ticket, { duplicateCandidates }),
  ]);

  const blocking = findings.filter((item) => item.severity === VALIDATION_SEVERITY.BLOCKING);
  const warnings = findings.filter((item) => item.severity === VALIDATION_SEVERITY.WARNING);
  const informational = findings.filter((item) => item.severity === VALIDATION_SEVERITY.INFO);

  return {
    readyForRunning: blocking.length === 0,
    findings,
    blocking,
    warnings,
    informational,
    counts: {
      blocking: blocking.length,
      warning: warnings.length,
      info: informational.length,
    },
    time,
  };
}
