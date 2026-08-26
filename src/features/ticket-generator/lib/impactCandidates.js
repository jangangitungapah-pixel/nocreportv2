import { normalizeOperationalText } from './operationalNormalization.js';

const IMPACT_HEADER = /^impact(?:\s+list)?\s*:?\s*$/i;
const INLINE_IMPACT_HEADER = /^impact(?:\s+list)?\s*:\s*(.+)$/i;
const LIST_PREFIX = /^(?:(?:[-*•▪◦]+)|(?:\d+\s*[.)-]))\s*/;

function entryValue(entry) {
  if (entry && typeof entry === 'object') return entry.value;
  return entry;
}

export function cleanImpactCandidate(value) {
  const normalized = normalizeOperationalText(value);
  if (!normalized || IMPACT_HEADER.test(normalized)) return '';

  const inline = normalized.match(INLINE_IMPACT_HEADER);
  const withoutHeader = inline ? inline[1] : normalized;
  return normalizeOperationalText(withoutHeader.replace(LIST_PREFIX, ''));
}

export function impactCandidateKey(value) {
  const cleaned = cleanImpactCandidate(entryValue(value));
  return cleaned ? cleaned.toLocaleUpperCase('en-US') : '';
}

export function parseImpactCandidates(input, { existing = [] } = {}) {
  const lines = String(input ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n');
  const existingKeys = new Set(existing.map(impactCandidateKey).filter(Boolean));
  const sourceKeys = new Set();
  const items = [];
  const duplicateItems = [];
  const existingDuplicateItems = [];

  for (let index = 0; index < lines.length; index += 1) {
    const value = cleanImpactCandidate(lines[index]);
    if (!value) continue;

    const key = impactCandidateKey(value);
    if (!key) continue;

    if (sourceKeys.has(key)) {
      duplicateItems.push({ value, sourceLine: index + 1, reason: 'source_duplicate' });
      continue;
    }
    sourceKeys.add(key);

    if (existingKeys.has(key)) {
      existingDuplicateItems.push({ value, sourceLine: index + 1, reason: 'already_present' });
      continue;
    }

    items.push({
      id: `impact-candidate-${index + 1}`,
      value,
      sourceLine: index + 1,
      selected: true,
    });
  }

  return {
    items,
    duplicateItems,
    existingDuplicateItems,
    stats: {
      proposedCount: items.length,
      sourceDuplicateCount: duplicateItems.length,
      existingDuplicateCount: existingDuplicateItems.length,
    },
  };
}

export function mergeImpactValues(existing = [], incoming = []) {
  const values = [];
  const seen = new Set();

  for (const entry of [...existing, ...incoming]) {
    const value = cleanImpactCandidate(entryValue(entry));
    const key = impactCandidateKey(value);
    if (!value || !key || seen.has(key)) continue;
    seen.add(key);
    values.push(value);
  }

  return values;
}
