import { describe, expect, it } from 'vitest';

import { PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY } from './progressSnippets.js';
import {
  DEFAULT_OPERATOR_PRESETS,
  EVENT_TIME_BEHAVIOR,
  OPERATOR_PRESETS_STORAGE_KEY,
  OPERATOR_PRESETS_VERSION,
  readOperatorPresets,
  resetOperatorPresets,
  sanitizeOperatorPresets,
  writeOperatorPresets,
} from './operatorPresets.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe('operatorPresets', () => {
  it('sanitizes only approved browser-local operator preferences', () => {
    const result = sanitizeOperatorPresets(
      {
        version: OPERATOR_PRESETS_VERSION,
        templateProfileId: 'MANDAU_DEFAULT',
        favoriteProgressSnippetIds: ['dispatch-default', 'dispatch-default', 'stale-id'],
        defaultPic: '  Team Majalengka  ',
        defaultCopyTarget: 'handover',
        eventTimeBehavior: EVENT_TIME_BEHAVIOR.BLANK,
        utilityState: {
          copyCenterExpanded: false,
          handoverExpanded: true,
          presetsExpanded: true,
        },
        role: 'ADMIN',
        permissions: ['ticket:delete'],
        canReadAudit: true,
      },
      { validSnippetIds: ['dispatch-default'] },
    );

    expect(result).toEqual({
      version: OPERATOR_PRESETS_VERSION,
      templateProfileId: 'MANDAU_DEFAULT',
      favoriteProgressSnippetIds: ['dispatch-default'],
      defaultPic: 'Team Majalengka',
      defaultCopyTarget: 'handover',
      eventTimeBehavior: 'blank',
      utilityState: {
        copyCenterExpanded: false,
        handoverExpanded: true,
        presetsExpanded: true,
      },
    });
    expect(result).not.toHaveProperty('role');
    expect(result).not.toHaveProperty('permissions');
    expect(result).not.toHaveProperty('canReadAudit');
  });

  it('fails safely to defaults for malformed or stale storage', () => {
    const malformed = memoryStorage({ [OPERATOR_PRESETS_STORAGE_KEY]: '{broken-json' });
    expect(readOperatorPresets({ storage: malformed })).toEqual({
      ...DEFAULT_OPERATOR_PRESETS,
      favoriteProgressSnippetIds: [],
      utilityState: { ...DEFAULT_OPERATOR_PRESETS.utilityState },
    });

    const stale = memoryStorage({
      [OPERATOR_PRESETS_STORAGE_KEY]: JSON.stringify({
        version: OPERATOR_PRESETS_VERSION + 1,
        defaultPic: 'must not leak forward',
      }),
    });
    expect(readOperatorPresets({ storage: stale }).defaultPic).toBe('');
  });

  it('migrates existing Progress favorites when the aggregate preset record is absent', () => {
    const storage = memoryStorage({
      [PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY]: JSON.stringify({
        version: 1,
        ids: ['dispatch-team', 'stale-id'],
      }),
    });

    const migrated = readOperatorPresets({
      storage,
      validSnippetIds: ['dispatch-team', 'arrival-location'],
    });

    expect(migrated.favoriteProgressSnippetIds).toEqual(['dispatch-team']);
    expect(migrated.defaultCopyTarget).toBe('full_report');
  });

  it('writes sanitized versioned preferences and Reset removes local state', () => {
    const storage = memoryStorage();
    expect(
      writeOperatorPresets(
        {
          templateProfileId: 'UNKNOWN_PROFILE',
          defaultPic: 'Team A',
          defaultCopyTarget: 'unknown_target',
          favoriteProgressSnippetIds: ['arrival-default', 'unknown-snippet'],
        },
        { storage, validSnippetIds: ['arrival-default'] },
      ),
    ).toBe(true);

    const stored = JSON.parse(storage.getItem(OPERATOR_PRESETS_STORAGE_KEY));
    expect(stored.version).toBe(OPERATOR_PRESETS_VERSION);
    expect(stored.templateProfileId).toBe('MANDAU_DEFAULT');
    expect(stored.defaultCopyTarget).toBe('full_report');
    expect(stored.favoriteProgressSnippetIds).toEqual(['arrival-default']);
    expect(JSON.parse(storage.getItem(PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY)).ids).toEqual([
      'arrival-default',
    ]);

    const reset = resetOperatorPresets({ storage, validSnippetIds: ['arrival-default'] });
    expect(storage.getItem(OPERATOR_PRESETS_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY)).toBeNull();
    expect(reset.defaultPic).toBe('');
    expect(reset.defaultCopyTarget).toBe('full_report');
  });
});
