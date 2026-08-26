import {
  buildPathKey,
  normalizeExternalTtReference,
  normalizeIncidentKey,
  normalizeOperationalText,
  parsePathEndpoints,
} from './operationalNormalization.js';

const EXTERNAL_TT_PATTERN = /(?:(?:DATACOM|DWDM)-)?INC-\d{8}-\d+/i;
const DIRECT_TT_LABEL = /\[\s*TT\s*:\s*([^\]]+)\]/i;
const TRANSPORT_PREFIXES = Object.freeze(['DWDM 1800', 'DWDM UJB', 'DWDM ZTE', 'OSN 3500', 'DWDM']);

function stripOuterEmphasis(value) {
  const normalized = normalizeOperationalText(value);
  if (normalized.startsWith('*') && normalized.endsWith('*') && normalized.length >= 2) {
    return normalizeOperationalText(normalized.slice(1, -1));
  }
  return normalized;
}

export function extractEmailExternalTt(value) {
  const normalized = normalizeOperationalText(value);
  if (!normalized) return null;

  const labeled = normalized.match(DIRECT_TT_LABEL)?.[1];
  const fromLabel = normalizeExternalTtReference(labeled);
  if (fromLabel) {
    const labeledMatch = fromLabel.match(EXTERNAL_TT_PATTERN)?.[0];
    if (labeledMatch) return normalizeExternalTtReference(labeledMatch);
  }

  const match = normalized.match(EXTERNAL_TT_PATTERN)?.[0];
  return normalizeExternalTtReference(match);
}

function parseDirectMandauSubject(subject) {
  const match = subject.match(/^\[MANDAU\]\s+LINK\s+DOWN\s+AT\s+(.+)$/i);
  if (!match) return null;

  const externalTtNumber = extractEmailExternalTt(subject);
  let remainder = normalizeOperationalText(match[1].replace(DIRECT_TT_LABEL, ''));
  const upper = remainder.toUpperCase();
  const transportFamily = TRANSPORT_PREFIXES.find(
    (prefix) => upper === prefix || upper.startsWith(`${prefix} `),
  );

  if (transportFamily) {
    remainder = normalizeOperationalText(remainder.slice(transportFamily.length));
  }

  const pathEndpoints = parsePathEndpoints(remainder);

  return {
    format: 'direct_mandau',
    profileTag: 'MANDAU',
    sourceStatus: null,
    severity: null,
    condition: 'DOWN',
    transportFamily: transportFamily ?? null,
    pathEndpoints,
    pathKey: buildPathKey(pathEndpoints),
    externalTtNumber,
    incidentKey: normalizeIncidentKey(externalTtNumber),
  };
}

function parseFlpSubject(subject) {
  const match = subject.match(/^\[([^\]]+)\]\[([^\]]+)\]\s+(.+)$/);
  if (!match) return null;

  const profileTag = normalizeOperationalText(match[1]);
  if (!/MANDAU/i.test(profileTag)) return null;

  const stateSeverity = normalizeOperationalText(match[2]);
  const [sourceStatus = '', severity = ''] = stateSeverity.split(/\s+-\s+/, 2);
  const rest = normalizeOperationalText(match[3]);
  const conditionMatch = rest.match(/^([^-]+?)\s+-\s+(.+)$/);
  if (!conditionMatch) return null;

  const condition = normalizeOperationalText(conditionMatch[1]).toUpperCase();
  const externalTtNumber = extractEmailExternalTt(rest);
  let pathText = normalizeOperationalText(conditionMatch[2]);

  if (externalTtNumber) {
    const ttIndex = pathText.toUpperCase().lastIndexOf(externalTtNumber.toUpperCase());
    if (ttIndex >= 0) {
      pathText = normalizeOperationalText(pathText.slice(0, ttIndex).replace(/\s+-\s*$/, ''));
    }
  }

  const pathEndpoints = parsePathEndpoints(pathText);

  return {
    format: 'flp_mandau',
    profileTag,
    sourceStatus: normalizeOperationalText(sourceStatus) || null,
    severity: normalizeOperationalText(severity) || null,
    condition,
    transportFamily: null,
    pathEndpoints,
    pathKey: buildPathKey(pathEndpoints),
    externalTtNumber,
    incidentKey: normalizeIncidentKey(externalTtNumber),
  };
}

export function parseEmailSubject(value) {
  const subject = stripOuterEmphasis(value);
  if (!subject) {
    return {
      format: 'unknown',
      profileTag: null,
      sourceStatus: null,
      severity: null,
      condition: null,
      transportFamily: null,
      pathEndpoints: [],
      pathKey: null,
      externalTtNumber: null,
      incidentKey: null,
    };
  }

  const fallbackTt = extractEmailExternalTt(subject);

  return (
    parseDirectMandauSubject(subject) ??
    parseFlpSubject(subject) ?? {
      format: 'unknown',
      profileTag: null,
      sourceStatus: null,
      severity: null,
      condition: null,
      transportFamily: null,
      pathEndpoints: [],
      pathKey: null,
      externalTtNumber: fallbackTt,
      incidentKey: normalizeIncidentKey(fallbackTt),
    }
  );
}
