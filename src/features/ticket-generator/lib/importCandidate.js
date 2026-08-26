import { normalizeOperationalText } from './operationalNormalization.js';

export const IMPORT_SOURCE_KINDS = Object.freeze([
  'report_text',
  'raw_alarm',
  'email_text',
  'outlook_msg',
  'eml',
]);

export const CANDIDATE_SOURCES = Object.freeze([
  'body',
  'subject',
  'filename',
  'inference',
  'message_metadata',
]);

export const CANDIDATE_CONFIDENCE = Object.freeze(['exact', 'strong', 'weak']);

function cloneValue(value) {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === 'object' && !(value instanceof Date)) return { ...value };
  return value;
}

export function createCandidateField({
  value = null,
  rawValue = value,
  source = 'inference',
  confidence = 'weak',
  sourceLine = null,
  selected = true,
} = {}) {
  if (!CANDIDATE_SOURCES.includes(source)) {
    throw new Error(`Unsupported candidate source: ${source}`);
  }
  if (!CANDIDATE_CONFIDENCE.includes(confidence)) {
    throw new Error(`Unsupported candidate confidence: ${confidence}`);
  }

  return {
    value: cloneValue(value),
    rawValue: cloneValue(rawValue),
    source,
    confidence,
    sourceLine,
    selected: Boolean(selected),
  };
}

function emptyField() {
  return createCandidateField({ selected: false });
}

export function createImportCandidate(overrides = {}) {
  const source = {
    kind: 'report_text',
    profileId: 'MANDAU_DEFAULT',
    parserVersion: 1,
    sourceName: null,
    subject: null,
    messageSentAt: null,
    ...overrides.source,
  };

  if (!IMPORT_SOURCE_KINDS.includes(source.kind)) {
    throw new Error(`Unsupported import source kind: ${source.kind}`);
  }

  return {
    source,
    fields: {
      title: emptyField(),
      externalTtNumber: emptyField(),
      incidentKey: emptyField(),
      occurAt: emptyField(),
      dispatchAt: emptyField(),
      pic: emptyField(),
      rootcause: emptyField(),
      cutPoint: emptyField(),
      impactList: emptyField(),
      ...overrides.fields,
    },
    alarmContext: {
      rawAlarm: emptyField(),
      alarmFamily: emptyField(),
      alarmSource: emptyField(),
      emsAlarmNo: emptyField(),
      siteId: emptyField(),
      siteName: emptyField(),
      severity: emptyField(),
      sourceStatus: emptyField(),
      dispatchTo: emptyField(),
      region: emptyField(),
      description: emptyField(),
      lastLinkFlapped: emptyField(),
      transportFamily: emptyField(),
      pathEndpoints: emptyField(),
      pathKey: emptyField(),
      externalTtReferences: emptyField(),
      ...overrides.alarmContext,
    },
    progress: Array.isArray(overrides.progress) ? [...overrides.progress] : [],
    warnings: Array.isArray(overrides.warnings) ? [...overrides.warnings] : [],
    conflicts: Array.isArray(overrides.conflicts) ? [...overrides.conflicts] : [],
    stats: { ...(overrides.stats ?? {}) },
  };
}

function defaultConflictNormalizer(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return JSON.stringify(value.map(defaultConflictNormalizer));
  if (value && typeof value === 'object') return JSON.stringify(value);
  return normalizeOperationalText(value).toUpperCase();
}

export function detectCandidateValueConflict(field, candidates, normalize = defaultConflictNormalizer) {
  const usable = (Array.isArray(candidates) ? candidates : []).filter((candidate) => {
    if (!candidate) return false;
    if (candidate.value === null || candidate.value === undefined) return false;
    if (typeof candidate.value === 'string' && !normalizeOperationalText(candidate.value)) return false;
    return true;
  });

  const normalizedValues = [...new Set(usable.map((candidate) => normalize(candidate.value)))];
  if (normalizedValues.length <= 1) return null;

  return {
    kind: 'value_mismatch',
    field,
    candidates: usable.map((candidate) => ({ ...candidate })),
    normalizedValues,
  };
}
