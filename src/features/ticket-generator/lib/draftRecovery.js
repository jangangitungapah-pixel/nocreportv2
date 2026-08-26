const DRAFT_RECOVERY_VERSION = 1;
const DRAFT_RECOVERY_PREFIX = 'nocreport-ticket-draft';
const NEW_TICKET_KEY = `${DRAFT_RECOVERY_PREFIX}:new`;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const SAFE_FORM_FIELDS = Object.freeze([
  'title',
  'impactList',
  'occurAt',
  'dispatchAt',
  'pic',
  'rootcause',
  'cutPoint',
  'latitude',
  'longitude',
  'coordinateSource',
  'coordinateDetectedFormat',
  'coordinateVerified',
]);

function storageOrNull(storage) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
}

function asIsoInstant(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeImpactList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map((entry) => ({ value: String(entry?.value ?? entry ?? '').trim() }))
    .filter((entry) => entry.value);
}

export function sanitizeDraftFormValues(values = {}) {
  const safe = {};
  for (const field of SAFE_FORM_FIELDS) {
    if (!(field in values)) continue;
    if (field === 'impactList') {
      safe.impactList = normalizeImpactList(values.impactList);
      continue;
    }
    if (field === 'coordinateVerified') {
      safe.coordinateVerified = values.coordinateVerified !== false;
      continue;
    }
    safe[field] = String(values[field] ?? '');
  }
  return safe;
}

export function sanitizeImportRecoveryMetadata(importReview) {
  const candidate = importReview?.candidate ?? importReview ?? null;
  if (!candidate) return null;

  const source = candidate.source ?? {};
  const warnings = Array.isArray(candidate.warnings)
    ? candidate.warnings.slice(0, 20).map((item) => String(item).slice(0, 200))
    : [];
  const conflicts = Array.isArray(candidate.conflicts)
    ? candidate.conflicts.slice(0, 20).map((item) => ({
        field: String(item?.field ?? '').slice(0, 80),
        severity: String(item?.severity ?? 'warning').slice(0, 20),
      }))
    : [];

  return {
    source: {
      kind: source.kind ? String(source.kind).slice(0, 40) : null,
      profileId: source.profileId ? String(source.profileId).slice(0, 80) : null,
      parserVersion: Number.isFinite(Number(source.parserVersion))
        ? Number(source.parserVersion)
        : null,
      messageSentAt: asIsoInstant(source.messageSentAt),
    },
    warnings,
    conflicts,
    identityResolution: importReview?.identityResolution
      ? String(importReview.identityResolution).slice(0, 120)
      : null,
  };
}

export function sanitizeProgressDraft(progressDraft) {
  if (!progressDraft) return { occurredAt: '', text: '' };
  return {
    occurredAt: String(progressDraft.occurredAt ?? '').slice(0, 40),
    text: String(progressDraft.text ?? '').slice(0, 5000),
  };
}

export function draftRecoveryKey({ ticketId = null, baseRevision = null } = {}) {
  if (!ticketId) return NEW_TICKET_KEY;
  const revision = Math.max(0, Number(baseRevision ?? 0));
  return `${DRAFT_RECOVERY_PREFIX}:ticket:${ticketId}:revision:${revision}`;
}

function ticketDraftPrefix(ticketId) {
  return `${DRAFT_RECOVERY_PREFIX}:ticket:${ticketId}:revision:`;
}

function buildPayload({
  ticketId = null,
  baseRevision = null,
  formValues = {},
  progressDraft = null,
  templateProfileId = 'MANDAU_DEFAULT',
  importReview = null,
  dirtyAt = new Date(),
} = {}) {
  return {
    version: DRAFT_RECOVERY_VERSION,
    ticketId: ticketId ? String(ticketId) : null,
    baseRevision: ticketId ? Math.max(0, Number(baseRevision ?? 0)) : null,
    dirtyAt: asIsoInstant(dirtyAt) ?? new Date().toISOString(),
    templateProfileId: String(templateProfileId || 'MANDAU_DEFAULT').slice(0, 80),
    formValues: sanitizeDraftFormValues(formValues),
    progressDraft: sanitizeProgressDraft(progressDraft),
    importMetadata: sanitizeImportRecoveryMetadata(importReview),
  };
}

function parsePayload(raw, { now = new Date(), ttlMs = DEFAULT_TTL_MS } = {}) {
  if (!raw) return { state: 'missing', payload: null };
  try {
    const payload = JSON.parse(raw);
    if (payload?.version !== DRAFT_RECOVERY_VERSION) {
      return { state: 'invalid', payload: null };
    }
    const dirtyAt = new Date(payload.dirtyAt);
    if (Number.isNaN(dirtyAt.getTime())) return { state: 'invalid', payload: null };
    if (now.getTime() - dirtyAt.getTime() > ttlMs) {
      return { state: 'expired', payload: null };
    }
    return { state: 'available', payload };
  } catch {
    return { state: 'invalid', payload: null };
  }
}

export function writeDraftRecovery(input, { storage } = {}) {
  const target = storageOrNull(storage);
  if (!target) return false;
  const payload = buildPayload(input);
  try {
    target.setItem(
      draftRecoveryKey({ ticketId: payload.ticketId, baseRevision: payload.baseRevision }),
      JSON.stringify(payload),
    );
    return true;
  } catch {
    return false;
  }
}

export function readDraftRecovery(
  { ticketId = null, currentRevision = null } = {},
  { storage, now = new Date(), ttlMs = DEFAULT_TTL_MS } = {},
) {
  const target = storageOrNull(storage);
  if (!target) return { state: 'missing', payload: null };

  if (!ticketId) {
    const result = parsePayload(target.getItem(NEW_TICKET_KEY), { now, ttlMs });
    if (result.state === 'expired' || result.state === 'invalid') {
      try {
        target.removeItem(NEW_TICKET_KEY);
      } catch {
        // Optional recovery storage must never block the editor.
      }
    }
    return result;
  }

  const exactKey = draftRecoveryKey({ ticketId, baseRevision: currentRevision });
  const exact = parsePayload(target.getItem(exactKey), { now, ttlMs });
  if (exact.state === 'available') return exact;

  let newest = null;
  try {
    const prefix = ticketDraftPrefix(ticketId);
    for (let index = 0; index < target.length; index += 1) {
      const key = target.key(index);
      if (!key?.startsWith(prefix) || key === exactKey) continue;
      const candidate = parsePayload(target.getItem(key), { now, ttlMs });
      if (candidate.state !== 'available') continue;
      if (!newest || candidate.payload.dirtyAt > newest.payload.dirtyAt) newest = candidate;
    }
  } catch {
    return { state: 'missing', payload: null };
  }

  if (!newest) return exact.state === 'missing' ? exact : { state: 'missing', payload: null };
  if (Number(newest.payload.baseRevision) !== Number(currentRevision)) {
    return { state: 'stale', payload: newest.payload };
  }
  return newest;
}

export function clearDraftRecovery({ ticketId = null, baseRevision = null } = {}, { storage } = {}) {
  const target = storageOrNull(storage);
  if (!target) return false;
  try {
    if (!ticketId) {
      target.removeItem(NEW_TICKET_KEY);
      return true;
    }
    const prefix = ticketDraftPrefix(ticketId);
    if (baseRevision != null) {
      target.removeItem(draftRecoveryKey({ ticketId, baseRevision }));
      return true;
    }
    const keys = [];
    for (let index = 0; index < target.length; index += 1) {
      const key = target.key(index);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    keys.forEach((key) => target.removeItem(key));
    return true;
  } catch {
    return false;
  }
}

export { DEFAULT_TTL_MS as DRAFT_RECOVERY_TTL_MS, DRAFT_RECOVERY_VERSION };
