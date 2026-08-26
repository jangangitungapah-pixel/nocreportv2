import { TICKET_STATUS } from '../../../entities/ticket/index.js';

export const DUPLICATE_EVIDENCE_LEVEL = Object.freeze({
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  WEAK: 'weak',
});

export const PATH_PROXIMITY_WINDOW_MS = 15 * 60 * 1000;
export const SITE_ALARM_PROXIMITY_WINDOW_MS = 30 * 60 * 1000;

const LEVEL_WEIGHT = Object.freeze({
  [DUPLICATE_EVIDENCE_LEVEL.CRITICAL]: 4,
  [DUPLICATE_EVIDENCE_LEVEL.HIGH]: 3,
  [DUPLICATE_EVIDENCE_LEVEL.MEDIUM]: 2,
  [DUPLICATE_EVIDENCE_LEVEL.WEAK]: 1,
});

const ACTIVE_STATUSES = new Set([TICKET_STATUS.DRAFT, TICKET_STATUS.RUNNING]);

function normalizedText(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function timeMillis(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function absoluteTimeDelta(left, right) {
  const leftMs = timeMillis(left);
  const rightMs = timeMillis(right);
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) return null;
  return Math.abs(leftMs - rightMs);
}

function titleTokens(value) {
  return new Set(
    normalizedText(value)
      .replace(/[^A-Z0-9]+/g, ' ')
      .split(' ')
      .filter((token) => token.length >= 3),
  );
}

function titleSimilarity(left, right) {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (a.size < 3 || b.size < 3) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function evidence(code, label, level, score, meta = null) {
  return { code, label, level, score, meta };
}

function strongestLevel(reasons) {
  return reasons.reduce((strongest, reason) => {
    if (!strongest) return reason.level;
    return LEVEL_WEIGHT[reason.level] > LEVEL_WEIGHT[strongest] ? reason.level : strongest;
  }, null);
}

function sameNormalized(left, right) {
  const a = normalizedText(left);
  const b = normalizedText(right);
  return Boolean(a && b && a === b);
}

function alarmValue(ticket, field) {
  return ticket?.alarmContext?.[field] ?? null;
}

export function scoreDuplicateCandidate(target, candidate) {
  if (!target || !candidate) {
    return { score: 0, level: null, reasons: [], occurDeltaMs: null, titleSimilarity: 0 };
  }

  const reasons = [];
  const occurDeltaMs = absoluteTimeDelta(target.occurAt, candidate.occurAt);
  const sameExternalTt = sameNormalized(target.externalTtNumber, candidate.externalTtNumber);
  const sameIncidentKey = sameNormalized(target.incidentKey, candidate.incidentKey);
  const samePath = sameNormalized(target.pathKey, candidate.pathKey);
  const activeCandidate = ACTIVE_STATUSES.has(candidate.status);

  if (sameExternalTt) {
    reasons.push(
      evidence(
        'EXACT_EXTERNAL_TT',
        'Exact external TT match',
        DUPLICATE_EVIDENCE_LEVEL.CRITICAL,
        100,
      ),
    );
  }

  if (sameIncidentKey) {
    reasons.push(
      evidence(
        'SAME_INCIDENT_KEY',
        'Same canonical incident identity',
        DUPLICATE_EVIDENCE_LEVEL.CRITICAL,
        90,
      ),
    );
  }

  if (samePath && Number.isFinite(occurDeltaMs) && occurDeltaMs <= PATH_PROXIMITY_WINDOW_MS) {
    reasons.push(
      evidence(
        'PATH_TIME_PROXIMITY',
        'Same path within 15 minutes',
        DUPLICATE_EVIDENCE_LEVEL.HIGH,
        70,
        { occurDeltaMs },
      ),
    );
  }

  if (samePath && activeCandidate) {
    reasons.push(
      evidence(
        'ACTIVE_SAME_PATH',
        'Active Ticket on the same path',
        DUPLICATE_EVIDENCE_LEVEL.HIGH,
        65,
      ),
    );
  }

  const sameSite = sameNormalized(alarmValue(target, 'siteId'), alarmValue(candidate, 'siteId'));
  const sameAlarmFamily = sameNormalized(
    alarmValue(target, 'alarmFamily'),
    alarmValue(candidate, 'alarmFamily'),
  );
  if (
    sameSite &&
    sameAlarmFamily &&
    Number.isFinite(occurDeltaMs) &&
    occurDeltaMs <= SITE_ALARM_PROXIMITY_WINDOW_MS
  ) {
    reasons.push(
      evidence(
        'SITE_ALARM_TIME_PROXIMITY',
        'Same Site ID and alarm family within 30 minutes',
        DUPLICATE_EVIDENCE_LEVEL.MEDIUM,
        40,
        { occurDeltaMs },
      ),
    );
  }

  const similarity = titleSimilarity(target.title, candidate.title);
  if (similarity >= 0.75) {
    reasons.push(
      evidence(
        'TITLE_SIMILARITY',
        'Highly similar normalized title',
        DUPLICATE_EVIDENCE_LEVEL.WEAK,
        10,
        { similarity },
      ),
    );
  }

  return {
    score: reasons.reduce((total, reason) => total + reason.score, 0),
    level: strongestLevel(reasons),
    reasons,
    occurDeltaMs,
    titleSimilarity: similarity,
  };
}

export function rankDuplicateCandidates(target, candidates, { excludeTicketId = null, limit = 12 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 12, 20));
  const seen = new Set();

  return (Array.isArray(candidates) ? candidates : [])
    .filter((candidate) => {
      if (!candidate?.id || candidate.id === excludeTicketId || seen.has(candidate.id)) return false;
      seen.add(candidate.id);
      return true;
    })
    .map((candidate) => ({
      ...candidate,
      duplicateEvidence: scoreDuplicateCandidate(target, candidate),
    }))
    .filter((candidate) => candidate.duplicateEvidence.score > 0)
    .sort((left, right) => {
      const levelDelta =
        (LEVEL_WEIGHT[right.duplicateEvidence.level] ?? 0) -
        (LEVEL_WEIGHT[left.duplicateEvidence.level] ?? 0);
      if (levelDelta !== 0) return levelDelta;

      const scoreDelta = right.duplicateEvidence.score - left.duplicateEvidence.score;
      if (scoreDelta !== 0) return scoreDelta;

      const leftDelta = left.duplicateEvidence.occurDeltaMs ?? Number.POSITIVE_INFINITY;
      const rightDelta = right.duplicateEvidence.occurDeltaMs ?? Number.POSITIVE_INFINITY;
      if (leftDelta !== rightDelta) return leftDelta - rightDelta;

      const updatedDelta = (timeMillis(right.updatedAt) ?? 0) - (timeMillis(left.updatedAt) ?? 0);
      if (updatedDelta !== 0) return updatedDelta;
      return String(left.id).localeCompare(String(right.id));
    })
    .slice(0, safeLimit);
}

export function duplicateLookupFingerprint(ticket) {
  if (!ticket) return '';
  return [
    normalizedText(ticket.externalTtNumber),
    normalizedText(ticket.incidentKey),
    normalizedText(ticket.pathKey),
    normalizedText(alarmValue(ticket, 'siteId')),
    normalizedText(alarmValue(ticket, 'alarmFamily')),
    String(timeMillis(ticket.occurAt) ?? ''),
    normalizedText(ticket.title),
  ].join('|');
}

export function hasDuplicateLookupSignal(ticket) {
  if (!ticket) return false;
  if (normalizedText(ticket.externalTtNumber)) return true;
  if (normalizedText(ticket.incidentKey)) return true;
  if (normalizedText(ticket.pathKey)) return true;

  return Boolean(
    normalizedText(alarmValue(ticket, 'siteId')) &&
      normalizedText(alarmValue(ticket, 'alarmFamily')) &&
      timeMillis(ticket.occurAt),
  );
}
