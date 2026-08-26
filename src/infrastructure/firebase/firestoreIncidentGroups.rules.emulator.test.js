import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getAuthClient } from './authClient.js';
import { getFirestoreClient } from './firestoreClient.js';
import { firestoreTicketRepository } from './firestoreTicketRepository.js';

const PROJECT_ID = 'demo-nocreport';
const FIRESTORE_HOST = 'http://127.0.0.1:8080';
const PASSWORD = 'nocreport-f5-group-security';
const shouldRunEmulatorTests =
  String(import.meta.env.VITE_FIREBASE_EMULATOR_TESTS ?? '').toLowerCase() === 'true';
const describeEmulator = shouldRunEmulatorTests ? describe : describe.skip;

const accounts = {
  operator: {
    email: 'f5-group-operator@nocreport.test',
    role: 'OPERATOR',
    active: true,
    uid: null,
  },
  viewer: {
    email: 'f5-group-viewer@nocreport.test',
    role: 'VIEWER',
    active: true,
    uid: null,
  },
};

async function requireOk(response, label) {
  if (response.ok) return response;
  throw new Error(`${label} failed: ${response.status} ${await response.text()}`);
}

async function seedProfile(account) {
  const url = `${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${encodeURIComponent(account.uid)}`;
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
          active: { booleanValue: account.active },
          role: { stringValue: account.role },
          email: { stringValue: account.email },
          displayName: { stringValue: account.role },
        },
      }),
    }),
    `Seed ${account.role} profile`,
  );
}

async function signInAs(account) {
  await signOut(getAuthClient()).catch(() => {});
  return signInWithEmailAndPassword(getAuthClient(), account.email, PASSWORD);
}

function groupDocument(actorUid, overrides = {}) {
  return {
    title: 'Related MANDAU incident',
    pathKey: 'NODE_A<>NODE_B',
    ticketIds: ['ticket-a', 'ticket-b'],
    createdAt: new Date('2026-08-26T12:00:00.000Z'),
    createdBy: actorUid,
    updatedAt: new Date('2026-08-26T12:00:00.000Z'),
    updatedBy: actorUid,
    ...overrides,
  };
}

async function expectPermissionDenied(operation) {
  try {
    await operation();
    throw new Error('Expected Firestore permission denial, but the operation succeeded.');
  } catch (error) {
    if (error?.message === 'Expected Firestore permission denial, but the operation succeeded.') {
      throw error;
    }
    expect(String(error?.code ?? error?.message)).toMatch(/permission[-_]denied/i);
  }
}

describeEmulator.sequential('GEN-F5 incident group Security Rules', () => {
  beforeAll(async () => {
    for (const account of Object.values(accounts)) {
      const credential = await createUserWithEmailAndPassword(
        getAuthClient(),
        account.email,
        PASSWORD,
      );
      account.uid = credential.user.uid;
      await seedProfile(account);
    }
    await signOut(getAuthClient());
  });

  afterAll(async () => {
    if (shouldRunEmulatorTests) await signOut(getAuthClient()).catch(() => {});
  });

  it('allows Operator create/update and Viewer read while denying Viewer mutation', async () => {
    const db = getFirestoreClient();
    const groupRef = doc(db, 'incidentGroups', 'f5-readable-group');

    await signInAs(accounts.operator);
    await setDoc(groupRef, groupDocument(accounts.operator.uid));
    await updateDoc(groupRef, {
      title: 'Updated related incident',
      updatedAt: new Date('2026-08-26T12:05:00.000Z'),
      updatedBy: accounts.operator.uid,
    });

    await signInAs(accounts.viewer);
    const snapshot = await getDoc(groupRef);
    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data().ticketIds).toEqual(['ticket-a', 'ticket-b']);
    await expectPermissionDenied(() =>
      updateDoc(groupRef, {
        title: 'Viewer forged update',
        updatedAt: new Date('2026-08-26T12:06:00.000Z'),
        updatedBy: accounts.viewer.uid,
      }),
    );
  });

  it('rejects forged actor identity and unbounded group membership', async () => {
    const db = getFirestoreClient();
    await signInAs(accounts.operator);

    await expectPermissionDenied(() =>
      setDoc(
        doc(db, 'incidentGroups', 'f5-forged-group'),
        groupDocument(accounts.viewer.uid, { updatedBy: accounts.operator.uid }),
      ),
    );

    await expectPermissionDenied(() =>
      setDoc(
        doc(db, 'incidentGroups', 'f5-oversized-group'),
        groupDocument(accounts.operator.uid, {
          ticketIds: Array.from({ length: 21 }, (_, index) => `ticket-${index + 1}`),
        }),
      ),
    );
  });

  it('rejects creating a Ticket already pre-linked to an incident group', async () => {
    await signInAs(accounts.operator);

    await expectPermissionDenied(() =>
      firestoreTicketRepository.createTicket({
        title: '[MANDAU] FORGED PRELINK [TT : INC-20260826-91000001]',
        occurAt: new Date('2026-08-26T13:00:00.000Z'),
        incidentGroupId: 'forged-prelinked-group',
      }),
    );
  });

  it('rejects direct incidentGroupId forging when the group post-state does not contain the Ticket', async () => {
    const db = getFirestoreClient();
    await signInAs(accounts.operator);

    const created = await firestoreTicketRepository.createTicket({
      title: '[MANDAU] FORGED DIRECT LINK [TT : INC-20260826-91000002]',
      occurAt: new Date('2026-08-26T13:05:00.000Z'),
    });
    const groupRef = doc(db, 'incidentGroups', 'f5-unrelated-group');
    await setDoc(
      groupRef,
      groupDocument(accounts.operator.uid, {
        ticketIds: ['some-other-ticket'],
      }),
    );

    await expectPermissionDenied(() =>
      updateDoc(doc(db, 'tickets', created.ticketId), {
        incidentGroupId: groupRef.id,
        revision: created.ticket.revision + 1,
        updatedAt: new Date('2026-08-26T13:06:00.000Z'),
        updatedBy: accounts.operator.uid,
      }),
    );
  });

  it('denies hard deletion of an incident group', async () => {
    const db = getFirestoreClient();
    const groupRef = doc(db, 'incidentGroups', 'f5-protected-group');
    await signInAs(accounts.operator);
    await setDoc(groupRef, groupDocument(accounts.operator.uid));
    await expectPermissionDenied(() => deleteDoc(groupRef));
  });
});
