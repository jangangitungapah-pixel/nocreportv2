import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  documentId: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  documentId: firestoreMocks.documentId,
  getDocs: firestoreMocks.getDocs,
  limit: firestoreMocks.limit,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
}));

vi.mock('./firestoreClient.js', () => ({
  getFirestoreClient: () => ({ id: 'db' }),
}));

vi.mock('./firebaseErrors.js', () => ({
  normalizeFirebaseError: (error) => error,
}));

import { listTicketAuditEvents } from './firestoreAuditQueries.js';

function auditDoc(id, data) {
  return { id, data: () => data };
}

beforeEach(() => {
  vi.clearAllMocks();
  firestoreMocks.collection.mockReturnValue({ id: 'audit-collection' });
  firestoreMocks.documentId.mockReturnValue({ id: '__name__' });
  firestoreMocks.orderBy.mockImplementation((field, direction) => ({ field, direction }));
  firestoreMocks.limit.mockImplementation((value) => ({ limit: value }));
  firestoreMocks.query.mockImplementation((...parts) => ({ parts }));
  firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
});

describe('listTicketAuditEvents', () => {
  it('hard-caps history reads at 50 and orders newest events deterministically', async () => {
    await listTicketAuditEvents({ ticketId: 'ticket-1', limit: 999 });

    expect(firestoreMocks.collection).toHaveBeenCalledWith(
      { id: 'db' },
      'tickets',
      'ticket-1',
      'auditEvents',
    );
    expect(firestoreMocks.orderBy).toHaveBeenNthCalledWith(1, 'createdAt', 'desc');
    expect(firestoreMocks.orderBy).toHaveBeenNthCalledWith(2, { id: '__name__' }, 'desc');
    expect(firestoreMocks.limit).toHaveBeenCalledWith(50);
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(1);
  });

  it('maps new revision diffs and keeps legacy audit events readable', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        auditDoc('new-update', {
          type: 'TICKET_UPDATED',
          actorUid: 'admin-1',
          revisionFrom: 8,
          revisionTo: 9,
          details: { changes: { pic: { from: 'A', to: 'B' } } },
          createdAt: { toDate: () => new Date('2026-08-26T18:00:00.000Z') },
        }),
        auditDoc('legacy-update', {
          type: 'TICKET_UPDATED',
          actorUid: 'admin-1',
          details: null,
          createdAt: { toDate: () => new Date('2026-08-20T10:00:00.000Z') },
        }),
      ],
    });

    const events = await listTicketAuditEvents({ ticketId: 'ticket-1', limit: 2 });

    expect(firestoreMocks.limit).toHaveBeenCalledWith(2);
    expect(events[0]).toMatchObject({
      id: 'new-update',
      type: 'TICKET_UPDATED',
      revisionFrom: 8,
      revisionTo: 9,
      details: { changes: { pic: { from: 'A', to: 'B' } } },
    });
    expect(events[0].createdAt).toEqual(new Date('2026-08-26T18:00:00.000Z'));
    expect(events[1]).toMatchObject({
      id: 'legacy-update',
      type: 'TICKET_UPDATED',
      revisionFrom: null,
      revisionTo: null,
      details: null,
    });
  });
});
