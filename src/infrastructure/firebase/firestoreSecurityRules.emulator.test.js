import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getAuthClient } from './authClient.js';
import { getFirestoreClient } from './firestoreClient.js';
import { firestoreTicketRepository } from './firestoreTicketRepository.js';

const PROJECT_ID = 'demo-nocreport';
const FIRESTORE_HOST = 'http://127.0.0.1:8080';
const PASSWORD = 'nocreport-security-password';
const shouldRunEmulatorTests =
  String(import.meta.env.VITE_FIREBASE_EMULATOR_TESTS ?? '').toLowerCase() === 'true';
const describeEmulator = shouldRunEmulatorTests ? describe : describe.skip;

const accounts = {
  admin: { email: 'security-admin@nocreport.test', role: 'ADMIN', active: true, uid: null },
  operator: {
    email: 'security-operator@nocreport.test',
    role: 'OPERATOR',
    active: true,
    uid: null,
  },
  viewer: { email: 'security-viewer@nocreport.test', role: 'VIEWER', active: true, uid: null },
  inactive: {
    email: 'security-inactive@nocreport.test',
    role: 'OPERATOR',
    active: false,
    uid: null,
  },
};

async function requireOk(response, label) {
  if (response.ok) return response;
  throw new Error(`${label} failed: ${response.status} ${await response.text()}`);
}

async function clearFirestore() {
  const url = `${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  await requireOk(await globalThis.fetch(url, { method: 'DELETE' }), 'Clear Firestore emulator');
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

async function seedProfiles() {
  for (const account of Object.values(accounts)) {
    await seedProfile(account);
  }
}

async function signInAs(account) {
  await signOut(getAuthClient()).catch(() => {});
  return signInWithEmailAndPassword(getAuthClient(), account.email, PASSWORD);
}

function ticketDocument(actorUid, overrides = {}) {
  return {
    schemaVersion: 1,
    title: '[SECURITY] LINK DOWN',
    externalTtNumber: null,
    impactList: [],
    occurAt: null,
    dispatchAt: null,
    pic: '',
    rootcause: '',
    cutPoint: '',
    coordinate: null,
    hasCoordinates: false,
    status: 'DRAFT',
    latestProgress: null,
    progressCount: 0,
    createdAt: new Date('2026-08-21T00:00:00.000Z'),
    createdBy: actorUid,
    updatedAt: new Date('2026-08-21T00:00:00.000Z'),
    updatedBy: actorUid,
    resolvedAt: null,
    resolvedBy: null,
    archivedAt: null,
    archivedBy: null,
    revision: 1,
    ...overrides,
  };
}

function schemaV2Metadata(overrides = {}) {
  return {
    schemaVersion: 2,
    titleMode: 'MANUAL',
    templateProfileId: 'MANDAU_DEFAULT',
    incidentKey: 'INC-20260826-00000054',
    pathKey: 'NODE_A<>NODE_B',
    alarmContext: {
      rawAlarm: 'Link Down',
      alarmFamily: 'LINK_DOWN',
      alarmSource: 'NMS',
      emsAlarmNo: 'EMS-001',
      siteId: 'NODE_A',
      siteName: 'NODE A',
      severity: 'Critical',
      sourceStatus: 'Open',
      dispatchTo: 'FIELD TEAM',
      region: 'JABOTABEK',
      description: '',
      lastLinkFlapped: '',
      transportFamily: 'DWDM',
      pathEndpoints: ['NODE A', 'NODE B'],
      externalTtReferences: ['INC-20260826-00000054'],
    },
    importProvenance: {
      sourceKind: 'outlook_msg',
      dispatchTimeSource: 'PR_CLIENT_SUBMIT_TIME',
      messageSentAt: new Date('2026-08-26T00:12:26.000Z'),
    },
    incidentGroupId: null,
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
    expect(String(error?.code ?? error?.message)).toMatch(/permission-denied/i);
  }
}

describeEmulator.sequential('Firestore Security Rules role matrix', () => {
  beforeAll(async () => {
    await clearFirestore();
    for (const account of Object.values(accounts)) {
      const credential = await createUserWithEmailAndPassword(
        getAuthClient(),
        account.email,
        PASSWORD,
      );
      account.uid = credential.user.uid;
    }
    await signOut(getAuthClient());
  });

  beforeEach(async () => {
    await clearFirestore();
    await seedProfiles();
    await signOut(getAuthClient()).catch(() => {});
  });

  afterAll(async () => {
    if (shouldRunEmulatorTests) {
      await signOut(getAuthClient()).catch(() => {});
      await clearFirestore();
    }
  });

  it('denies unauthenticated operational reads and writes', async () => {
    const db = getFirestoreClient();
    await expectPermissionDenied(() => getDocs(collection(db, 'tickets')));
    await expectPermissionDenied(() =>
      setDoc(doc(db, 'tickets', 'anonymous-write'), ticketDocument('forged-uid')),
    );
  });

  it('allows Viewer Ticket and Progress repository reads but denies Ticket mutation', async () => {
    const db = getFirestoreClient();
    await signInAs(accounts.admin);
    await setDoc(doc(db, 'tickets', 'viewer-readable'), ticketDocument(accounts.admin.uid));
    await setDoc(doc(db, 'tickets', 'viewer-readable', 'progress', 'progress-1'), {
      text: 'Viewer-readable progress',
      occurredAt: new Date('2026-08-21T00:30:00.000Z'),
      createdAt: new Date('2026-08-21T00:31:00.000Z'),
      createdBy: accounts.admin.uid,
      updatedAt: new Date('2026-08-21T00:31:00.000Z'),
      updatedBy: accounts.admin.uid,
    });

    await signInAs(accounts.viewer);
    const [ticket, progressPage] = await Promise.all([
      firestoreTicketRepository.getTicketById('viewer-readable'),
      firestoreTicketRepository.listProgress({
        ticketId: 'viewer-readable',
        pageSize: 100,
        direction: 'asc',
      }),
    ]);
    expect(ticket.id).toBe('viewer-readable');
    expect(progressPage.items.map((item) => item.id)).toContain('progress-1');
    expect(progressPage.hasMore).toBe(false);

    await expectPermissionDenied(() =>
      setDoc(doc(db, 'tickets', 'viewer-write'), ticketDocument(accounts.viewer.uid)),
    );
  });

  it('allows Operator operational create/update but denies archive', async () => {
    await signInAs(accounts.operator);
    const created = await firestoreTicketRepository.createTicket({
      title: '[SECURITY] OPERATOR TICKET',
      occurAt: new Date('2026-08-21T01:00:00.000Z'),
    });
    const saved = await firestoreTicketRepository.saveTicket({
      ticketId: created.ticketId,
      expectedRevision: 1,
      patch: { pic: 'Operator A' },
    });

    expect(created.ticket.schemaVersion).toBe(2);
    expect(saved.ticket.schemaVersion).toBe(2);
    expect(saved.ticket.pic).toBe('Operator A');
    await expect(
      firestoreTicketRepository.archiveTicket({
        ticketId: created.ticketId,
        expectedRevision: saved.revision,
      }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });

  it('allows validated v2 metadata and a one-way v1 to v2 upgrade', async () => {
    const db = getFirestoreClient();
    await signInAs(accounts.operator);

    await setDoc(
      doc(db, 'tickets', 'valid-v2'),
      ticketDocument(accounts.operator.uid, schemaV2Metadata()),
    );

    const legacyRef = doc(db, 'tickets', 'legacy-upgrade');
    await setDoc(legacyRef, ticketDocument(accounts.operator.uid));
    await updateDoc(legacyRef, {
      ...schemaV2Metadata(),
      updatedAt: new Date('2026-08-21T00:05:00.000Z'),
      updatedBy: accounts.operator.uid,
      revision: 2,
    });

    await expectPermissionDenied(() =>
      updateDoc(legacyRef, {
        schemaVersion: 1,
        updatedAt: new Date('2026-08-21T00:06:00.000Z'),
        updatedBy: accounts.operator.uid,
        revision: 3,
      }),
    );
  });

  it('rejects malformed schema-v2 operational metadata', async () => {
    const db = getFirestoreClient();
    await signInAs(accounts.operator);

    await expectPermissionDenied(() =>
      setDoc(
        doc(db, 'tickets', 'invalid-v2-title-mode'),
        ticketDocument(accounts.operator.uid, schemaV2Metadata({ titleMode: 'AUTO_MAGIC' })),
      ),
    );

    await expectPermissionDenied(() =>
      setDoc(
        doc(db, 'tickets', 'invalid-v2-path-size'),
        ticketDocument(
          accounts.operator.uid,
          schemaV2Metadata({
            alarmContext: {
              ...schemaV2Metadata().alarmContext,
              pathEndpoints: Array.from({ length: 17 }, (_, index) => `NODE ${index + 1}`),
            },
          }),
        ),
      ),
    );
  });

  it('denies inactive users even when their persisted role is Operator', async () => {
    await signInAs(accounts.inactive);
    await expectPermissionDenied(() => getDocs(collection(getFirestoreClient(), 'tickets')));
  });

  it('prevents Operator self-promotion and allows Admin role management', async () => {
    const db = getFirestoreClient();
    const operatorRef = doc(db, 'users', accounts.operator.uid);

    await signInAs(accounts.operator);
    await expectPermissionDenied(() => updateDoc(operatorRef, { role: 'ADMIN' }));

    await signInAs(accounts.admin);
    await updateDoc(operatorRef, { role: 'VIEWER', active: true });
  });

  it('rejects forged actor identities and invalid coordinates', async () => {
    const db = getFirestoreClient();
    await signInAs(accounts.operator);

    await expectPermissionDenied(() =>
      setDoc(
        doc(db, 'tickets', 'forged-actor'),
        ticketDocument(accounts.admin.uid, { updatedBy: accounts.operator.uid }),
      ),
    );

    await expectPermissionDenied(() =>
      setDoc(
        doc(db, 'tickets', 'invalid-coordinate'),
        ticketDocument(accounts.operator.uid, {
          hasCoordinates: true,
          coordinate: {
            latitude: 95,
            longitude: 181,
            verified: true,
            verifiedBy: accounts.operator.uid,
          },
        }),
      ),
    );
  });

  it('denies normal hard Ticket delete and audit rewrite/delete', async () => {
    const db = getFirestoreClient();
    await signInAs(accounts.admin);
    const ticketRef = doc(db, 'tickets', 'protected-ticket');
    await setDoc(ticketRef, ticketDocument(accounts.admin.uid));

    await expectPermissionDenied(() => deleteDoc(ticketRef));

    const auditRef = doc(db, 'tickets', 'protected-ticket', 'auditEvents', 'audit-1');
    await setDoc(auditRef, {
      type: 'TICKET_UPDATED',
      actorUid: accounts.admin.uid,
      createdAt: new Date('2026-08-21T01:00:00.000Z'),
    });
    await expectPermissionDenied(() => updateDoc(auditRef, { type: 'FORGED' }));
    await expectPermissionDenied(() => deleteDoc(auditRef));
  });
});
