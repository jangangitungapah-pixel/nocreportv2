const MISSING_TEXT_VALUES = new Set(['undefined']);

export function normalizeOperationalText(value) {
  if (value === null || value === undefined) return '';

  const normalized = String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized || MISSING_TEXT_VALUES.has(normalized.toLowerCase())) return '';
  return normalized;
}

export function normalizeExternalTtReference(value) {
  const normalized = normalizeOperationalText(value);
  return normalized ? normalized.toUpperCase() : null;
}

export function normalizeIncidentKey(value) {
  const normalized = normalizeExternalTtReference(value);
  if (!normalized) return null;

  return normalized.match(/\bINC-\d{8}-\d+\b/)?.[0] ?? null;
}

function alarmToken(value) {
  return normalizeOperationalText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeAlarm(value) {
  const rawAlarm = normalizeOperationalText(value);
  if (!rawAlarm) {
    return { rawAlarm: '', alarmFamily: null };
  }

  const token = alarmToken(rawAlarm);
  const alarmFamily =
    token === 'LINK_DOWN' || token === 'PHYSICAL_PORT_DOWN' ? 'LINK_DOWN' : token || null;

  return { rawAlarm, alarmFamily };
}

export function parsePathEndpoints(value) {
  const source = Array.isArray(value) ? value : String(value ?? '').split(/\s*<>\s*/);
  return source.map(normalizeOperationalText).filter(Boolean);
}

export function canonicalizePathEndpoint(value) {
  const normalized = normalizeOperationalText(value)
    .replace(/\([^)]*\)/g, ' ')
    .trim();

  if (!normalized) return null;

  return normalized
    .toUpperCase()
    .replace(/[\s_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildPathKey(value) {
  const endpoints = parsePathEndpoints(value).map(canonicalizePathEndpoint).filter(Boolean);

  if (endpoints.length < 2) return null;

  const forward = endpoints.join('<>');
  const reverse = [...endpoints].reverse().join('<>');

  return forward.localeCompare(reverse) <= 0 ? forward : reverse;
}

export function deriveOperationalIdentity({ externalTtNumber, pathEndpoints } = {}) {
  return {
    incidentKey: normalizeIncidentKey(externalTtNumber),
    pathKey: buildPathKey(pathEndpoints),
  };
}
