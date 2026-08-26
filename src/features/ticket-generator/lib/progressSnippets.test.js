import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PROGRESS_SNIPPETS,
  PROGRESS_SNIPPET_CATEGORIES,
  PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY,
  PROGRESS_SNIPPET_PREFERENCES_VERSION,
  readProgressSnippetFavorites,
  resolveProgressSnippet,
  toggleProgressSnippetFavorite,
  writeProgressSnippetFavorites,
} from './progressSnippets.js';

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    dump: () => Object.fromEntries(values),
  };
}

describe('GEN-F3 Progress snippets', () => {
  it('ships one profile-ready snippet category for every initial operational category', () => {
    expect([...new Set(DEFAULT_PROGRESS_SNIPPETS.map((snippet) => snippet.category))]).toEqual(
      PROGRESS_SNIPPET_CATEGORIES,
    );
  });

  it('requires declared placeholders before a snippet can be inserted', () => {
    const snippet = DEFAULT_PROGRESS_SNIPPETS.find((entry) => entry.id === 'dispatch-team');
    const incomplete = resolveProgressSnippet(snippet, { destination: 'NODE_A' });

    expect(incomplete.resolved).toBe(false);
    expect(incomplete.missingKeys).toEqual(['eta']);
    expect(incomplete.text).toContain('{eta}');

    const resolved = resolveProgressSnippet(snippet, {
      destination: ' NODE_A ',
      eta: ' 75 menit ',
    });
    expect(resolved).toEqual({
      resolved: true,
      text: 'Team dispatched to NODE_A, ETA 75 menit',
      missingKeys: [],
      values: { destination: 'NODE_A', eta: '75 menit' },
    });
  });

  it('supports optional placeholders without blocking insertion', () => {
    const snippet = DEFAULT_PROGRESS_SNIPPETS.find((entry) => entry.id === 'escalation-party');
    expect(resolveProgressSnippet(snippet, { party: 'FO Team' })).toMatchObject({
      resolved: true,
      text: 'Escalated to FO Team',
      missingKeys: [],
    });
    expect(resolveProgressSnippet(snippet, { party: 'FO Team', note: 'Need ETA' })).toMatchObject({
      resolved: true,
      text: 'Escalated to FO Team · Need ETA',
    });
  });

  it('stores browser-local favorites as a versioned preference and filters stale ids', () => {
    const storage = memoryStorage();
    writeProgressSnippetFavorites(['dispatch-team', 'dispatch-team', 'unknown'], { storage });

    expect(
      readProgressSnippetFavorites({
        storage,
        validIds: DEFAULT_PROGRESS_SNIPPETS.map((snippet) => snippet.id),
      }),
    ).toEqual(['dispatch-team']);
    expect(JSON.parse(storage.dump()[PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY])).toEqual({
      version: PROGRESS_SNIPPET_PREFERENCES_VERSION,
      ids: ['dispatch-team', 'unknown'],
    });
  });

  it('fails safely on malformed or stale local preference payloads and toggles favorites', () => {
    const malformed = memoryStorage({ [PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY]: '{bad json' });
    expect(readProgressSnippetFavorites({ storage: malformed })).toEqual([]);

    const stale = memoryStorage({
      [PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY]: JSON.stringify({ version: 0, ids: ['dispatch-team'] }),
    });
    expect(readProgressSnippetFavorites({ storage: stale })).toEqual([]);

    const storage = memoryStorage();
    expect(toggleProgressSnippetFavorite('dispatch-team', [], { storage })).toEqual(['dispatch-team']);
    expect(toggleProgressSnippetFavorite('dispatch-team', ['dispatch-team'], { storage })).toEqual([]);
  });
});
