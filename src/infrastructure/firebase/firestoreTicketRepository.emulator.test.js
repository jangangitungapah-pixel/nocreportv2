import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TICKET_STATUS } from '../../entities/ticket/index.js';
import { getAuthClient } from './authClient.js';
import { getFirestoreClient } from './firestoreClient.js';
import { firestoreTicketRepository } from './firestoreTicketRepository.js';

const PROJECT_ID = 'demo-nocreport';
const FIRESTORE_HOST = 'http://127.0.0.1:8080';
const shouldRunEmulatorTests =
  String(import.meta.env.VITE_FIREBASE_EMULATOR_TESTS ?? '').toLowerCase() === 'true';
const describeEmulator = shouldRunEmulatorTests ? describe : describe.skip;

let adminUid = null;

function ticketInput(overrides = {}) {
  return {
    title: '[MANDAU] LINK DOWN, [TT : INC-20260818-00015849]',
    occurAt: new Date('2026-08-18T07:20:00.000Z'),
    dispatchAt: new Date('2026-08-18T07:20:00.000Z'),
    pic: 'Agus',
    rootcause: '',
    cutPoint: 'KM 24 from Majalengka',
    ...overrides,
  };
}

async function requireOk(response, label) {
  if (response.ok) return response;
  throw new Error(`${label} failed: ${response.status} ${await response.text()}`);
}

async function clearFirestore() {
  const url = `${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  await requireOk(await globalThis.fetch(url, { method: 'DELETE' }), 'Clear Firestore emulator');
}

async function seedAdminProfile(uid) {
  const url = `${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
  await requireOk(
    await globalThis.fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          active: { booleanValue: true },
          role: { stringValue: 'ADMIN' },
          displayName: { stringValue: 'CI Admin' },
        },
      }),
    }),
    'Seed emulator admin profile',
  );
}

async function resetOperationalData() {
  await clearFirestore();
  await seedAdminProfile(adminUid);
}

describeEmulator('Firestore Ticket repository emulator integration', () => {
  beforeAll(async () => {
    await clearFirestore();
    const credential = await createUserWithEmailAndPassword(
      getAuthClient(),
      'ci-admin@nocreport.test',
      'nocreport-emulator-password',
    );
    adminUid = credential.user.uid;
    await seedAdminProfile(adminUid);
  });

  beforeEach(async () => {
    await resetOperationalData();
  });

  afterAll(async () => {
    if (shouldRunEmulatorTests) {
      await signOut(getAuthClient());
      await clearFirestore();
    }
  });

  it('creates, loads, and saves a Ticket through Firestore Security Rules', async () => {
    const created = await firestoreTicketRepository.createTicket(ticketInput());

    expect(created.ticket).toMatchObject({
      id: created.ticketId,
      status: TICKET_STATUS.DRAFT,
      revision: 1,
      pic: 'Agus',
    });

    const loaded = await firestoreTicketRepository.getTicketById(created.ticketId);
    expect(loaded.title).toContain('INC-20260818-00015849');

    const saved = await firestoreTicketRepository.saveTicket({
      ticketId: created.ticketId,
      expectedRevision: 1,
      patch: { rootcause: 'Fiber cut after forest fire impact' },
    });

    expect(saved.revision).toBe(2);
    expect(saved.ticket.rootcause).toBe('Fiber cut after forest fire impact');
  });

  it('maintains progress summary fields when backdated progress is appended', async () => {
    const created = await firestoreTicketRepository.createTicket(ticketInput());
    const first = await firestoreTicketRepository.appendProgress({
      ticketId: created.ticketId,
      expectedRevision: 1,
      occurredAt: new Date('2026-08-18T09:00:00.000Z'),
      text: 'team arrived at cut point',
    });
    const backdated = await firestoreTicketRepository.appendProgress({
      ticketId: created.ticketId,
      expectedRevision: first.ticketRevision,
      occurredAt: new Date('2026-08-18T08:00:00.000Z'),
      text: 'team OTW to cut point',
    });

    expect(backdated.progressCount).toBe(2);
    expect(backdated.latestProgress.text).toBe('team arrived at cut point');

    const page = await firestoreTicketRepository.listProgress({ ticketId: created.ticketId });
    expect(page.items.map((entry) => entry.text)).toEqual([
      'team OTW to cut point',
      'team arrived at cut point',
    ]);
  });

  it('rejects a stale revision instead of overwriting a concurrent change', async () => {
    const created = await firestoreTicketRepository.createTicket(ticketInput());

    await firestoreTicketRepository.saveTicket({
      ticketId: created.ticketId,
      expectedRevision: 1,
      patch: { pic: 'Operator A' },
    });

    await expect(
      firestoreTicketRepository.saveTicket({
        ticketId: created.ticketId,
        expectedRevision: 1,
        patch: { pic: 'Operator B' },
      }),
    ).rejects.toMatchObject({ code: 'STALE_REVISION' });
  });

  it('persists only verified coordinate metadata and keeps hasCoordinates atomic', async () => {
    const created = await firestoreTicketRepository.createTicket(ticketInput());
    const updated = await firestoreTicketRepository.updateCoordinate({
      ticketId: created.ticketId,
      expectedRevision: 1,
      coordinate: {
        latitude: -6.5942716667,
        longitude: 106.66605,
        source: 'ocr',
        detectedFormat: 'DMS',
      },
    });

    expect(updated.ticket.hasCoordinates).toBe(true);
    expect(updated.ticket.coordinate).toMatchObject({
      latitude: -6.5942716667,
      longitude: 106.66605,
      source: 'ocr',
      detectedFormat: 'DMS',
      verified: true,
      verifiedBy: adminUid,
    });

    const cleared = await firestoreTicketRepository.clearCoordinate({
      ticketId: created.ticketId,
      expectedRevision: updated.revision,
    });
    expect(cleared.ticket.hasCoordinates).toBe(false);
    expect(cleared.ticket.coordinate).toBeNull();
  });

  it('supports Running, Resolve, archive, restore, and records audit events', async () => {
    const created = await firestoreTicketRepository.createTicket(ticketInput());
    const running = await firestoreTicketRepository.transitionTicketStatus({
      ticketId: created.ticketId,
      expectedRevision: 1,
      toStatus: TICKET_STATUS.RUNNING,
    });
    const resolved = await firestoreTicketRepository.transitionTicketStatus({
      ticketId: created.ticketId,
      expectedRevision: running.revision,
      toStatus: TICKET_STATUS.RESOLVED,
    });
    const archived = await firestoreTicketRepository.archiveTicket({
      ticketId: created.ticketId,
      expectedRevision: resolved.revision,
    });
    const restored = await firestoreTicketRepository.restoreTicket({
      ticketId: created.ticketId,
      expectedRevision: archived.revision,
      toStatus: TICKET_STATUS.RESOLVED,
    });

    expect(restored.ticket.status).toBe(TICKET_STATUS.RESOLVED);
    expect(restored.ticket.archivedAt).toBeNull();

    const auditSnapshot = await getDocs(
      collection(getFirestoreClient(), 'tickets', created.ticketId, 'auditEvents'),
    );
    const eventTypes = auditSnapshot.docs.map((item) => item.data().type);
    expect(eventTypes).toContain('TICKET_CREATED');
    expect(eventTypes.filter((type) => type === 'STATUS_CHANGED')).toHaveLength(4);
  });

  it('keeps archived Tickets out of the default operational list and Dashboard recent activity', async () => {
    const active = await firestoreTicketRepository.createTicket(
      ticketInput({ title: '[MANDAU] ACTIVE LINK DOWN' }),
    );
    const archived = await firestoreTicketRepository.createTicket(
      ticketInput({ title: '[MANDAU] OLD RESOLVED LINK' }),
    );
    await firestoreTicketRepository.archiveTicket({
      ticketId: archived.ticketId,
      expectedRevision: 1,
    });

    const operational = await firestoreTicketRepository.listTickets({ limit: 20 });
    expect(operational.items.map((ticket) => ticket.id)).toContain(active.ticketId);
    expect(operational.items.map((ticket) => ticket.id)).not.toContain(archived.ticketId);

    const dashboard = await firestoreTicketRepository.getDashboardSummary();
    expect(dashboard.recentlyUpdated.map((ticket) => ticket.id)).toContain(active.ticketId);
    expect(dashboard.recentlyUpdated.map((ticket) => ticket.id)).not.toContain(archived.ticketId);
  });
});
