import { normalizeOperationalText } from './operationalNormalization.js';

export const PROGRESS_SNIPPET_PREFERENCES_VERSION = 1;
export const PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY = 'nocreport-progress-snippet-favorites';

export const PROGRESS_SNIPPET_CATEGORIES = Object.freeze([
  'Dispatch',
  'Arrival',
  'Investigation',
  'OTDR',
  'Material',
  'Jointing',
  'Monitoring',
  'Clearance',
  'Escalation',
]);

function placeholder(key, label, { type = 'text', required = true } = {}) {
  return Object.freeze({ key, label, type, required });
}

export const DEFAULT_PROGRESS_SNIPPETS = Object.freeze([
  Object.freeze({
    id: 'dispatch-team',
    label: 'Team dispatched',
    category: 'Dispatch',
    template: 'Team dispatched to {destination}, ETA {eta}',
    placeholders: Object.freeze([
      placeholder('destination', 'Destination'),
      placeholder('eta', 'ETA'),
    ]),
  }),
  Object.freeze({
    id: 'arrival-location',
    label: 'Team arrived',
    category: 'Arrival',
    template: 'Team arrived at {location}',
    placeholders: Object.freeze([placeholder('location', 'Location')]),
  }),
  Object.freeze({
    id: 'investigation-scope',
    label: 'Investigation',
    category: 'Investigation',
    template: 'Investigation in progress: {scope}',
    placeholders: Object.freeze([placeholder('scope', 'Investigation scope')]),
  }),
  Object.freeze({
    id: 'otdr-result',
    label: 'OTDR result',
    category: 'OTDR',
    template: 'OTDR result: {result}',
    placeholders: Object.freeze([placeholder('result', 'OTDR result')]),
  }),
  Object.freeze({
    id: 'material-eta',
    label: 'Material prepared',
    category: 'Material',
    template: 'Material {material} prepared, ETA {eta}',
    placeholders: Object.freeze([placeholder('material', 'Material'), placeholder('eta', 'ETA')]),
  }),
  Object.freeze({
    id: 'jointing-progress',
    label: 'Jointing progress',
    category: 'Jointing',
    template: 'Jointing {scope} in progress',
    placeholders: Object.freeze([placeholder('scope', 'Jointing scope')]),
  }),
  Object.freeze({
    id: 'monitoring-duration',
    label: 'Monitoring',
    category: 'Monitoring',
    template: 'Link normalized, monitoring for {duration}',
    placeholders: Object.freeze([placeholder('duration', 'Monitoring duration')]),
  }),
  Object.freeze({
    id: 'clearance-party',
    label: 'Clearance received',
    category: 'Clearance',
    template: 'Clearance received from {party}',
    placeholders: Object.freeze([placeholder('party', 'Clearance party')]),
  }),
  Object.freeze({
    id: 'escalation-party',
    label: 'Escalated',
    category: 'Escalation',
    template: 'Escalated to {party}{note}',
    placeholders: Object.freeze([
      placeholder('party', 'Escalation party'),
      placeholder('note', 'Optional note', { required: false }),
    ]),
  }),
]);

function normalizePlaceholderValue(value) {
  return normalizeOperationalText(value);
}

export function resolveProgressSnippet(snippet, values = {}) {
  if (!snippet?.template) {
    return { resolved: false, text: '', missingKeys: [], values: {} };
  }

  const placeholders = Array.isArray(snippet.placeholders) ? snippet.placeholders : [];
  const normalizedValues = Object.fromEntries(
    placeholders.map((item) => [item.key, normalizePlaceholderValue(values[item.key])]),
  );
  const missingKeys = placeholders
    .filter((item) => item.required && !normalizedValues[item.key])
    .map((item) => item.key);

  let text = String(snippet.template).replace(/\{([A-Za-z0-9_-]+)\}/g, (match, key) => {
    const value = normalizedValues[key];
    if (value) {
      if (key === 'note' && !/^\s/.test(value)) return ` · ${value}`;
      return value;
    }
    const definition = placeholders.find((item) => item.key === key);
    return definition?.required ? match : '';
  });
  text = normalizeOperationalText(text);

  return {
    resolved: missingKeys.length === 0,
    text,
    missingKeys,
    values: normalizedValues,
  };
}

function defaultStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function readProgressSnippetFavorites({ storage = defaultStorage(), validIds = null } = {}) {
  if (!storage) return [];

  try {
    const raw = storage.getItem(PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed?.version !== PROGRESS_SNIPPET_PREFERENCES_VERSION || !Array.isArray(parsed.ids)) {
      return [];
    }

    const allowed = validIds ? new Set(validIds) : null;
    return parsed.ids
      .filter((id) => typeof id === 'string' && (!allowed || allowed.has(id)))
      .filter((id, index, ids) => ids.indexOf(id) === index);
  } catch {
    return [];
  }
}

export function writeProgressSnippetFavorites(ids, { storage = defaultStorage() } = {}) {
  const normalized = (Array.isArray(ids) ? ids : [])
    .filter((id) => typeof id === 'string' && id)
    .filter((id, index, values) => values.indexOf(id) === index);

  if (!storage) return normalized;

  try {
    storage.setItem(
      PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY,
      JSON.stringify({ version: PROGRESS_SNIPPET_PREFERENCES_VERSION, ids: normalized }),
    );
  } catch {
    // Preferences are optional. Storage failure must not block Progress authoring.
  }

  return normalized;
}

export function toggleProgressSnippetFavorite(id, currentIds = [], options = {}) {
  if (!id) return writeProgressSnippetFavorites(currentIds, options);
  const current = new Set(Array.isArray(currentIds) ? currentIds : []);
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return writeProgressSnippetFavorites([...current], options);
}
