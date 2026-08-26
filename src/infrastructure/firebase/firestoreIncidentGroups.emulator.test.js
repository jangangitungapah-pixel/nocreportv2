import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getAuthClient } from './authClient.js';
import {
  createIncidentGroupFromTickets,
  linkTicketToIncidentGroup,
  listRelatedTickets,
  unlinkTicketFromIncidentGroup,
} from './firestoreIncidentGroups.js';
import { firestoreTicketRepository } from './firestoreTicketRepository.js';

const PROJECT_ID = 'demo-nocreport';
const FIRESTORE_HOST = 'http://127.0.0.1:8080';
const PASSWORD = 'nocreport-f5-group-repository';
const EMAIL = 'f5-group-repository@nocreport.test';
const shouldRunEmulatorTests =
  String(import.meta.env.VITE_FIREBASE_EMULATOR_TESTS ?? '').toLowerCase() === 'true';
const describeEmulator = shouldRunEmulatorTests ? describe : describe.skip;

let uid = null;

async function requireOk(response, label) {
  if (response.ok) return response;
  throw new Error(`${label} failed: ${response.status} ${await response.text()}`);
}

async function seedProfile() {
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
          schemaVersion: { integerValue: '1' },
          active: { booleanValue: true },
          role: { stringValue: 'OPERATOR' },
          email: { stringValue: EMAIL },
          displayName: { stringValue: 'F5 Operator' },
        },
      }),
    }),
    'Seed F5 operator profile',
  );
}

async function signInOperator() {
  await signOut(getAuthClient()).catch(() => {});
  return signInWithEmailAndPassword(getAuthClient(), EMAIL, PASSWORD);
}

describeEmulator.sequential('GEN-F5 incident group repository', () => {
  beforeAll(async () => {
    const credential = await createUserWithEmailAndPassword(getAuthClient(), EMAIL, PASSWORD);
    uid = credential.user.uid;
    await seedProfile();
    await signInOperator();
  });

  afterAll(async () => {
    if (shouldRunEmulatorTests) await signOut(getAuthClient()).catch(() => {});
  });

  it('finds bounded duplicate candidates, then creates, lists, unlinks and relinks related Tickets with revision checks', async () => {
    await signInOperator();
    const left = await firestoreTicketRepository.createTicket({
      title: '[MANDAU] LINK DOWN AT DWDM F5_A <> F5_B [TT : INC-20260826-90000001]',
      occurAt: new Date('2026-08-26T12:00:00.000Z'),
      externalTtNumber: 'INC-20260826-90000001',
      incidentKey: 'INC-20260826-90000001',
      pathKey: 'F5_A<>F5_B',
    });
    const right = await firestoreTicketRepository.createTicket({
      title: '[MANDAU] LINK DOWN AT DWDM F5_A <> F5_B [TT : INC-20260826-90000002]',
      occurAt: new Date('2026-08-26T12:05:00.000Z'),
      externalTtNumber: 'INC-20260826-90000002',
      incidentKey: 'INC-20260826-90000002',
      pathKey: 'F5_A<>F5_B',
    });

    const duplicateCandidates = await firestoreTicketRepository.findDuplicateTicketCandidates({
      ticket: {
        externalTtNumber: 'INC-20260826-90000001',
        incidentKey: 'INC-20260826-90000001',
        pathKey: 'F5_A<>F5_B',
        occurAt: new Date('2026-08-26T12:00:00.000Z'),
      },
      excludeTicketId: left.ticketId,
      limit: 8,
      recentWindowHours: 1,
    });
    expect(duplicateCandidates.length).toBeLessThanOrEqual(8);
    expect(duplicateCandidates.some((ticket) => ticket.id === left.ticketId)).toBe(false);
    expect(duplicateCandidates.some((ticket) => ticket.id === right.ticketId)).toBe(true);

    const group = await createIncidentGroupFromTickets({
      members: [
        { ticketId: left.ticketId, expectedRevision: left.revision },
        { ticketId: right.ticketId, expectedRevision: right.revision },
      ],
      title: 'F5 related path incident',
      pathKey: 'F5_A<>F5_B',
    });

    expect(group.ticketIds).toEqual([left.ticketId, right.ticketId]);

    const [leftLinked, rightLinked, related] = await Promise.all([
      firestoreTicketRepository.getTicketById(left.ticketId),
      firestoreTicketRepository.getTicketById(right.ticketId),
      listRelatedTickets({ groupId: group.id, excludeTicketId: left.ticketId, limit: 20 }),
    ]);
    expect(leftLinked.incidentGroupId).toBe(group.id);
    expect(rightLinked.incidentGroupId).toBe(group.id);
    expect(leftLinked.revision).toBe(2);
    expect(rightLinked.revision).toBe(2);
    expect(related.tickets.map((ticket) => ticket.id)).toEqual([right.ticketId]);

    await expect(
      unlinkTicketFromIncidentGroup({
        groupId: group.id,
        ticketId: left.ticketId,
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({ code: 'STALE_REVISION' });

    const unlinkedGroup = await unlinkTicketFromIncidentGroup({
      groupId: group.id,
      ticketId: left.ticketId,
      expectedRevision: leftLinked.revision,
    });
    expect(unlinkedGroup.ticketIds).toEqual([right.ticketId]);

    const leftUnlinked = await firestoreTicketRepository.getTicketById(left.ticketId);
    expect(leftUnlinked.incidentGroupId).toBeNull();
    expect(leftUnlinked.revision).toBe(3);

    const relinkedGroup = await linkTicketToIncidentGroup({
      groupId: group.id,
      ticketId: left.ticketId,
      expectedRevision: leftUnlinked.revision,
    });
    expect(relinkedGroup.ticketIds).toEqual([right.ticketId, left.ticketId]);

    const leftRelinked = await firestoreTicketRepository.getTicketById(left.ticketId);
    expect(leftRelinked.incidentGroupId).toBe(group.id);
    expect(leftRelinked.revision).toBe(4);
  });
});
