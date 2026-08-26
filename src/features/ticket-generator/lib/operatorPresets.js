import { COPY_TARGET_IDS, isCopyTargetId } from './copyCenter.js';
import {
  PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY,
  readProgressSnippetFavorites,
  writeProgressSnippetFavorites,
} from './progressSnippets.js';
import { getTemplateProfile, TEMPLATE_PROFILE_IDS } from './templateProfiles.js';

export const OPERATOR_PRESETS_VERSION = 1;
export const OPERATOR_PRESETS_STORAGE_KEY = 'nocreport-operator-presets';

export const EVENT_TIME_BEHAVIOR = Object.freeze({
  NOW: 'now',
  BLANK: 'blank',
});

export const DEFAULT_OPERATOR_PRESETS = Object.freeze({
  version: OPERATOR_PRESETS_VERSION,
  templateProfileId: TEMPLATE_PROFILE_IDS.MANDAU_DEFAULT,
  favoriteProgressSnippetIds: Object.freeze([]),
  defaultPic: '',
  defaultCopyTarget: COPY_TARGET_IDS.FULL_REPORT,
  utilityState: Object.freeze({
    copyCenterExpanded: true,
    handoverExpanded: false,
    presetsExpanded: false,
  }),
  eventTimeBehavior: EVENT_TIME_BEHAVIOR.NOW,
});

function storageOrNull(storage) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
}

function cleanText(value, maxLength = 160) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validProfileId(value) {
  return getTemplateProfile(value)?.id ?? DEFAULT_OPERATOR_PRESETS.templateProfileId;
}

function validCopyTarget(value, profileId) {
  if (isCopyTargetId(value)) return value;
  const profileDefault = getTemplateProfile(profileId)?.defaultCopyTarget;
  return isCopyTargetId(profileDefault)
    ? profileDefault
    : DEFAULT_OPERATOR_PRESETS.defaultCopyTarget;
}

function favoriteSnippetIds(value, validSnippetIds = []) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(Array.isArray(validSnippetIds) ? validSnippetIds : []);
  const seen = new Set();
  return value
    .map((id) => cleanText(id, 120))
    .filter((id) => {
      if (!id || seen.has(id)) return false;
      if (allowed.size && !allowed.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, 64);
}

function utilityState(value) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    copyCenterExpanded:
      typeof input.copyCenterExpanded === 'boolean'
        ? input.copyCenterExpanded
        : DEFAULT_OPERATOR_PRESETS.utilityState.copyCenterExpanded,
    handoverExpanded:
      typeof input.handoverExpanded === 'boolean'
        ? input.handoverExpanded
        : DEFAULT_OPERATOR_PRESETS.utilityState.handoverExpanded,
    presetsExpanded:
      typeof input.presetsExpanded === 'boolean'
        ? input.presetsExpanded
        : DEFAULT_OPERATOR_PRESETS.utilityState.presetsExpanded,
  };
}

function eventTimeBehavior(value) {
  return Object.values(EVENT_TIME_BEHAVIOR).includes(value)
    ? value
    : DEFAULT_OPERATOR_PRESETS.eventTimeBehavior;
}

export function sanitizeOperatorPresets(value = {}, { validSnippetIds = [] } = {}) {
  const profileId = validProfileId(value.templateProfileId);
  return {
    version: OPERATOR_PRESETS_VERSION,
    templateProfileId: profileId,
    favoriteProgressSnippetIds: favoriteSnippetIds(
      value.favoriteProgressSnippetIds,
      validSnippetIds,
    ),
    defaultPic: cleanText(value.defaultPic),
    defaultCopyTarget: validCopyTarget(value.defaultCopyTarget, profileId),
    utilityState: utilityState(value.utilityState),
    eventTimeBehavior: eventTimeBehavior(value.eventTimeBehavior),
  };
}

function defaultsWithLegacyFavorites(target, validSnippetIds) {
  const legacyFavorites = readProgressSnippetFavorites({ storage: target, validIds: validSnippetIds });
  return sanitizeOperatorPresets(
    { favoriteProgressSnippetIds: legacyFavorites },
    { validSnippetIds },
  );
}

export function readOperatorPresets({ storage, validSnippetIds = [] } = {}) {
  const target = storageOrNull(storage);
  if (!target) return sanitizeOperatorPresets({}, { validSnippetIds });

  try {
    const raw = target.getItem(OPERATOR_PRESETS_STORAGE_KEY);
    if (!raw) return defaultsWithLegacyFavorites(target, validSnippetIds);
    const parsed = JSON.parse(raw);
    if (parsed?.version !== OPERATOR_PRESETS_VERSION) {
      return defaultsWithLegacyFavorites(target, validSnippetIds);
    }
    return sanitizeOperatorPresets(parsed, { validSnippetIds });
  } catch {
    return defaultsWithLegacyFavorites(target, validSnippetIds);
  }
}

export function writeOperatorPresets(value, { storage, validSnippetIds = [] } = {}) {
  const target = storageOrNull(storage);
  if (!target) return false;
  const next = sanitizeOperatorPresets(value, { validSnippetIds });
  try {
    target.setItem(OPERATOR_PRESETS_STORAGE_KEY, JSON.stringify(next));
    writeProgressSnippetFavorites(next.favoriteProgressSnippetIds, { storage: target });
    return true;
  } catch {
    return false;
  }
}

export function resetOperatorPresets({ storage, validSnippetIds = [] } = {}) {
  const target = storageOrNull(storage);
  if (target) {
    try {
      target.removeItem(OPERATOR_PRESETS_STORAGE_KEY);
      target.removeItem(PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY);
    } catch {
      // Optional browser-local preferences must never block Generator authoring.
    }
  }
  return sanitizeOperatorPresets({}, { validSnippetIds });
}
