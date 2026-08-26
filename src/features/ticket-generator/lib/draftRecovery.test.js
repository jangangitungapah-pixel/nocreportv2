import { describe, expect, it } from 'vitest';

import {
  DRAFT_RECOVERY_TTL_MS,
  DRAFT_RECOVERY_VERSION,
  clearDraftRecovery,
  draftRecoveryKey,
  readDraftRecovery,
  sanitizeImportRecoveryMetadata,
  writeDraftRecovery,
} from './draftRecovery.js';

function memoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

describe('draftRecovery', () => {
  it('stores a versioned new-Ticket draft using only the safe recovery shape', () => {
    const storage = memoryStorage();
    const dirtyAt = new Date('2026-08-26T17:00:00.000Z');

    expect(
      writeDraftRecovery(
        {
          formValues: {
            title: 'Operator title',
            impactList: [{ value: 'SITE_A' }, { value: 'SITE_B' }],
            pic: 'Team A',
            unknownSecretField: 'must not persist',
          },
          progressDraft: {
            occurredAt: '2026-08-27T00:00',
            text: 'Team OTW ke lokasi.',
            binary: 'must not persist',
          },
          templateProfileId: 'MANDAU_DEFAULT',
          importReview: {
            identityResolution: 'keep-current',
            candidate: {
              source: {
                kind: 'outlook_msg',
                profileId: 'MANDAU_DEFAULT',
                parserVersion: 1,
                messageSentAt: '2026-08-26T16:55:00.000Z',
                subject: 'do not persist subject',
              },
              rawBody: 'do not persist raw email body',
              fields: {
                title: { rawValue: 'do not persist raw field evidence' },
              },
              warnings: ['Email Sent Time was not available; Dispatch Time needs review.'],
              conflicts: [{ field: 'externalTtNumber', severity: 'blocking', rawValue: 'secret' }],
            },
          },
          dirtyAt,
        },
        { storage },
      ),
    ).toBe(true);

    const raw = storage.getItem(draftRecoveryKey());
    const persisted = JSON.parse(raw);
    expect(persisted.version).toBe(DRAFT_RECOVERY_VERSION);
    expect(persisted.formValues).toEqual({
      title: 'Operator title',
      impactList: [{ value: 'SITE_A' }, { value: 'SITE_B' }],
      pic: 'Team A',
    });
    expect(persisted.progressDraft).toEqual({
      occurredAt: '2026-08-27T00:00',
      text: 'Team OTW ke lokasi.',
    });
    expect(persisted.importMetadata).toEqual({
      source: {
        kind: 'outlook_msg',
        profileId: 'MANDAU_DEFAULT',
        parserVersion: 1,
        messageSentAt: '2026-08-26T16:55:00.000Z',
      },
      warnings: ['Email Sent Time was not available; Dispatch Time needs review.'],
      conflicts: [{ field: 'externalTtNumber', severity: 'blocking' }],
      identityResolution: 'keep-current',
    });
    expect(raw).not.toContain('raw email body');
    expect(raw).not.toContain('do not persist subject');
    expect(raw).not.toContain('raw field evidence');
    expect(raw).not.toContain('unknownSecretField');
  });

  it('expires stale new-Ticket drafts by TTL and removes the expired payload', () => {
    const storage = memoryStorage();
    const dirtyAt = new Date('2026-08-01T00:00:00.000Z');
    writeDraftRecovery({ formValues: { title: 'old' }, dirtyAt }, { storage });

    const result = readDraftRecovery(
      {},
      {
        storage,
        now: new Date(dirtyAt.getTime() + DRAFT_RECOVERY_TTL_MS + 1),
      },
    );

    expect(result).toEqual({ state: 'expired', payload: null });
    expect(storage.getItem(draftRecoveryKey())).toBeNull();
  });

  it('returns stale instead of auto-restoring an existing Ticket draft from another base revision', () => {
    const storage = memoryStorage();
    writeDraftRecovery(
      {
        ticketId: 'ticket-1',
        baseRevision: 8,
        formValues: { title: 'unsaved edit' },
        dirtyAt: new Date('2026-08-26T17:00:00.000Z'),
      },
      { storage },
    );

    const result = readDraftRecovery(
      { ticketId: 'ticket-1', currentRevision: 9 },
      { storage, now: new Date('2026-08-26T17:05:00.000Z') },
    );

    expect(result.state).toBe('stale');
    expect(result.payload.baseRevision).toBe(8);
    expect(result.payload.formValues.title).toBe('unsaved edit');
  });

  it('loads an exact existing-Ticket revision and can clear all recovery snapshots for that Ticket', () => {
    const storage = memoryStorage();
    writeDraftRecovery(
      {
        ticketId: 'ticket-2',
        baseRevision: 4,
        formValues: { title: 'draft r4' },
        dirtyAt: new Date('2026-08-26T17:00:00.000Z'),
      },
      { storage },
    );
    writeDraftRecovery(
      {
        ticketId: 'ticket-2',
        baseRevision: 5,
        formValues: { title: 'draft r5' },
        dirtyAt: new Date('2026-08-26T17:01:00.000Z'),
      },
      { storage },
    );

    const result = readDraftRecovery(
      { ticketId: 'ticket-2', currentRevision: 5 },
      { storage, now: new Date('2026-08-26T17:02:00.000Z') },
    );
    expect(result.state).toBe('available');
    expect(result.payload.formValues.title).toBe('draft r5');

    expect(clearDraftRecovery({ ticketId: 'ticket-2' }, { storage })).toBe(true);
    expect(storage.length).toBe(0);
  });

  it('keeps recovery optional when browser storage throws', () => {
    const storage = {
      get length() {
        throw new Error('blocked');
      },
      key() {
        throw new Error('blocked');
      },
      getItem() {
        return null;
      },
      setItem() {
        throw new Error('quota');
      },
      removeItem() {
        throw new Error('blocked');
      },
    };

    expect(writeDraftRecovery({ formValues: { title: 'x' } }, { storage })).toBe(false);
    expect(clearDraftRecovery({}, { storage })).toBe(false);
    expect(readDraftRecovery({ ticketId: 'ticket-x', currentRevision: 1 }, { storage })).toEqual({
      state: 'missing',
      payload: null,
    });
  });

  it('sanitizes import recovery metadata without persisting raw candidate values', () => {
    expect(
      sanitizeImportRecoveryMetadata({
        candidate: {
          source: { kind: 'email_text', subject: 'private subject' },
          warnings: [],
          conflicts: [{ field: 'title', severity: 'warning', values: ['raw-a', 'raw-b'] }],
          body: '<html>private</html>',
        },
      }),
    ).toEqual({
      source: {
        kind: 'email_text',
        profileId: null,
        parserVersion: null,
        messageSentAt: null,
      },
      warnings: [],
      conflicts: [{ field: 'title', severity: 'warning' }],
      identityResolution: null,
    });
  });
});
