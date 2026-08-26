const GENERATOR_IMPORT_FIELDS = Object.freeze([
  'title',
  'impactList',
  'occurAt',
  'dispatchAt',
  'pic',
  'rootcause',
  'cutPoint',
]);

function stableValue(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '').trim();
}

function hasCurrentValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(stableValue(value));
}

export function buildSelectiveApplyPlan(candidate, currentValues = {}, { dirtyFields = [] } = {}) {
  const dirty = new Set(dirtyFields);

  return GENERATOR_IMPORT_FIELDS.map((field) => {
    const imported = candidate?.fields?.[field];
    const currentValue = currentValues?.[field];
    const incomingValue = imported?.value;
    const selected = Boolean(
      imported?.selected && incomingValue !== null && incomingValue !== undefined,
    );
    const replacement =
      selected &&
      hasCurrentValue(currentValue) &&
      stableValue(currentValue) !== stableValue(incomingValue);
    const isDirty = dirty.has(field);

    return {
      field,
      selected,
      incomingValue,
      currentValue,
      replacement,
      dirty: isDirty,
      requiresConfirmation: replacement && isDirty,
      source: imported?.source ?? null,
      confidence: imported?.confidence ?? null,
    };
  });
}

export function applySelectiveImport(
  candidate,
  currentValues = {},
  { dirtyFields = [], confirmedFields = [] } = {},
) {
  const confirmed = new Set(confirmedFields);
  const plan = buildSelectiveApplyPlan(candidate, currentValues, { dirtyFields });
  const nextValues = { ...currentValues };
  const appliedFields = [];
  const skippedFields = [];

  for (const item of plan) {
    if (!item.selected) continue;
    if (item.requiresConfirmation && !confirmed.has(item.field)) {
      skippedFields.push(item.field);
      continue;
    }

    nextValues[item.field] = item.incomingValue;
    appliedFields.push(item.field);
  }

  return { nextValues, appliedFields, skippedFields, plan };
}
