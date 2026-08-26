import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import {
  TICKET_STATUS,
  buildTicketUpdatedAuditDetails,
  createEmptyTicket,
  extractExternalTicketNumber,
  normalizeCoordinates,
  validateRunningRequirements,
  validateTicketTransition,
} from '../../entities/ticket/index.js';
import { getAuthClient } from './authClient.js';
import { createInfrastructureError, normalizeFirebaseError } from './firebaseErrors.js';
import { getFirestoreClient } from './firestoreClient.js';
import { mapProgressSnapshot, mapTicketSnapshot, timestampMillis } from './firestoreMappers.js';

function requireCurrentUser() {
  const user = getAuthClient().currentUser;
  if (!user) {
    throw createInfrastructureError('NOT_AUTHENTICATED', 'Sign in before modifying Ticket data.');
  }
  return user;
}

function assertExpectedRevision(data, expectedRevision, ticketId) {
  const currentRevision = Number(data?.revision ?? 0);
  if (currentRevision !== Number(expectedRevision)) {
    throw createInfrastructureError('STALE_REVISION', 'Ticket has changed since it was loaded.', {
      details: { ticketId, expectedRevision, currentRevision },
    });
  }
}

function auditData(type, actorUid, details = null, metadata = null) {
  return {
    ...(metadata ?? {}),
    type,
    actorUid,
    details,
    createdAt: serverTimestamp(),
  };
}

function schemaV2FeatureData(ticket) {
  return {
    schemaVersion: 2,
    titleMode: ticket.titleMode,
    templateProfileId: ticket.templateProfileId,
    incidentKey: ticket.incidentKey,
    pathKey: ticket.pathKey,
    alarmContext: ticket.alarmContext,
    importProvenance: ticket.importProvenance,
    incidentGroupId: ticket.incidentGroupId,
  };
}

function verifiedCoordinate(coordinate, actorUid) {
  if (!coordinate) return null;

  const normalized = normalizeCoordinates(coordinate.latitude, coordinate.longitude);
  if (!normalized) {
    throw createInfrastructureError('INVALID_COORDINATE', 'Coordinate is outside the valid range.');
  }

  return {
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    source: coordinate.source === 'ocr' ? 'ocr' : 'manual',
    detectedFormat: coordinate.detectedFormat ?? null,
    verified: true,
    verifiedAt: serverTimestamp(),
    verifiedBy: actorUid,
  };
}

function validateCreationStatus(ticket) {
  if (ticket.status === TICKET_STATUS.DRAFT) return;
  if (ticket.status === TICKET_STATUS.RUNNING) {
    const validation = validateRunningRequirements(ticket);
    if (validation.valid) return;
    throw createInfrastructureError(
      'VALIDATION_ERROR',
      'Running Ticket requirements are incomplete.',
      {
        details: { fields: validation.errors },
      },
    );
  }

  throw createInfrastructureError(
    'VALIDATION_ERROR',
    'A new Ticket must start as Draft or Running.',
  );
}

export async function createTicket(input = {}) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const ticket = createEmptyTicket({
      ...input,
      schemaVersion: 2,
      status: input.status ?? TICKET_STATUS.DRAFT,
    });
    validateCreationStatus(ticket);

    const ticketRef = doc(collection(db, 'tickets'));
    const auditRef = doc(collection(ticketRef, 'auditEvents'));
    const coordinate = verifiedCoordinate(ticket.coordinate, user.uid);
    const batch = writeBatch(db);

    batch.set(ticketRef, {
      ...schemaV2FeatureData(ticket),
      title: ticket.title,
      externalTtNumber: ticket.externalTtNumber ?? extractExternalTicketNumber(ticket.title),
      impactList: ticket.impactList,
      occurAt: ticket.occurAt,
      dispatchAt: ticket.dispatchAt,
      pic: ticket.pic,
      rootcause: ticket.rootcause,
      cutPoint: ticket.cutPoint,
      coordinate,
      hasCoordinates: Boolean(coordinate),
      status: ticket.status,
      latestProgress: null,
      progressCount: 0,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      resolvedAt: null,
      resolvedBy: null,
      archivedAt: null,
      archivedBy: null,
      revision: 1,
    });
    batch.set(auditRef, auditData('TICKET_CREATED', user.uid));
    await batch.commit();

    const snapshot = await getDoc(ticketRef);
    return { ticketId: ticketRef.id, ticket: mapTicketSnapshot(snapshot) };
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}

export async function saveTicket({ ticketId, expectedRevision, patch = {} }) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const ticketRef = doc(db, 'tickets', ticketId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ticketRef);
      if (!snapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
          details: { ticketId },
        });
      }

      assertExpectedRevision(snapshot.data(), expectedRevision, ticketId);
      const current = mapTicketSnapshot(snapshot);
      const candidate = createEmptyTicket({
        ...current,
        ...patch,
        id: ticketId,
        schemaVersion: 2,
      });
      const nextExternalTtNumber =
        patch.externalTtNumber ?? extractExternalTicketNumber(candidate.title) ?? null;
      const auditedCandidate = createEmptyTicket({
        ...candidate,
        externalTtNumber: nextExternalTtNumber,
      });
      const revisionFrom = Number(expectedRevision);
      const revisionTo = revisionFrom + 1;
      const audit = buildTicketUpdatedAuditDetails({
        previousTicket: current,
        nextTicket: auditedCandidate,
        revisionFrom,
        revisionTo,
      });
      const auditRef = doc(collection(ticketRef, 'auditEvents'));

      transaction.update(ticketRef, {
        ...schemaV2FeatureData(auditedCandidate),
        title: auditedCandidate.title,
        externalTtNumber: nextExternalTtNumber,
        impactList: auditedCandidate.impactList,
        occurAt: auditedCandidate.occurAt,
        dispatchAt: auditedCandidate.dispatchAt,
        pic: auditedCandidate.pic,
        rootcause: auditedCandidate.rootcause,
        cutPoint: auditedCandidate.cutPoint,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        revision: revisionTo,
      });
      transaction.set(
        auditRef,
        auditData('TICKET_UPDATED', user.uid, audit.details, {
          revisionFrom: audit.revisionFrom,
          revisionTo: audit.revisionTo,
        }),
      );
    });

    const snapshot = await getDoc(ticketRef);
    return { ticket: mapTicketSnapshot(snapshot), revision: Number(expectedRevision) + 1 };
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}

export async function transitionTicketStatus({ ticketId, expectedRevision, toStatus }) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const ticketRef = doc(db, 'tickets', ticketId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ticketRef);
      if (!snapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
          details: { ticketId },
        });
      }

      assertExpectedRevision(snapshot.data(), expectedRevision, ticketId);
      const current = mapTicketSnapshot(snapshot);
      const validation = validateTicketTransition(current, toStatus);
      if (!validation.valid) {
        throw createInfrastructureError(
          'VALIDATION_ERROR',
          'Ticket status transition is not allowed.',
          {
            details: { fields: validation.errors },
          },
        );
      }

      const auditRef = doc(collection(ticketRef, 'auditEvents'));
      const patch = {
        status: toStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        revision: Number(expectedRevision) + 1,
      };

      if (toStatus === TICKET_STATUS.RESOLVED) {
        patch.resolvedAt = serverTimestamp();
        patch.resolvedBy = user.uid;
      }
      if (toStatus === TICKET_STATUS.ARCHIVED) {
        patch.archivedAt = serverTimestamp();
        patch.archivedBy = user.uid;
      }
      if (current.status === TICKET_STATUS.ARCHIVED && toStatus !== TICKET_STATUS.ARCHIVED) {
        patch.archivedAt = null;
        patch.archivedBy = null;
      }

      transaction.update(ticketRef, patch);
      transaction.set(
        auditRef,
        auditData('STATUS_CHANGED', user.uid, { fromStatus: current.status, toStatus }),
      );
    });

    const snapshot = await getDoc(ticketRef);
    return { ticket: mapTicketSnapshot(snapshot), revision: Number(expectedRevision) + 1 };
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}

export async function updateCoordinate({ ticketId, expectedRevision, coordinate }) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const ticketRef = doc(db, 'tickets', ticketId);
    const nextCoordinate = verifiedCoordinate(coordinate, user.uid);

    if (!nextCoordinate) {
      throw createInfrastructureError('INVALID_COORDINATE', 'Coordinate is required.');
    }

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ticketRef);
      if (!snapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
          details: { ticketId },
        });
      }
      assertExpectedRevision(snapshot.data(), expectedRevision, ticketId);

      const auditRef = doc(collection(ticketRef, 'auditEvents'));
      transaction.update(ticketRef, {
        coordinate: nextCoordinate,
        hasCoordinates: true,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        revision: Number(expectedRevision) + 1,
      });
      transaction.set(auditRef, auditData('COORDINATE_UPDATED', user.uid));
    });

    const snapshot = await getDoc(ticketRef);
    return { ticket: mapTicketSnapshot(snapshot), revision: Number(expectedRevision) + 1 };
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}

export async function clearCoordinate({ ticketId, expectedRevision }) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const ticketRef = doc(db, 'tickets', ticketId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ticketRef);
      if (!snapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
          details: { ticketId },
        });
      }
      assertExpectedRevision(snapshot.data(), expectedRevision, ticketId);

      const auditRef = doc(collection(ticketRef, 'auditEvents'));
      transaction.update(ticketRef, {
        coordinate: null,
        hasCoordinates: false,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        revision: Number(expectedRevision) + 1,
      });
      transaction.set(auditRef, auditData('COORDINATE_CLEARED', user.uid));
    });

    const snapshot = await getDoc(ticketRef);
    return { ticket: mapTicketSnapshot(snapshot), revision: Number(expectedRevision) + 1 };
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}

export async function appendProgress({ ticketId, expectedRevision, occurredAt, text }) {
  try {
    const normalizedText = String(text ?? '').trim();
    const occurredDate = occurredAt instanceof Date ? occurredAt : new Date(occurredAt);
    if (!normalizedText || Number.isNaN(occurredDate.getTime())) {
      throw createInfrastructureError(
        'VALIDATION_ERROR',
        'Progress requires a valid time and text.',
      );
    }

    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const ticketRef = doc(db, 'tickets', ticketId);
    const progressRef = doc(collection(ticketRef, 'progress'));

    await runTransaction(db, async (transaction) => {
      const ticketSnapshot = await transaction.get(ticketRef);
      if (!ticketSnapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
          details: { ticketId },
        });
      }
      const ticketData = ticketSnapshot.data();
      assertExpectedRevision(ticketData, expectedRevision, ticketId);

      const latestProgress = ticketData.latestProgress ?? null;
      const shouldBecomeLatest =
        !latestProgress || occurredDate.getTime() >= timestampMillis(latestProgress.occurredAt);
      const nextLatestProgress = shouldBecomeLatest
        ? { progressId: progressRef.id, occurredAt: occurredDate, text: normalizedText }
        : latestProgress;
      const auditRef = doc(collection(ticketRef, 'auditEvents'));

      transaction.set(progressRef, {
        occurredAt: occurredDate,
        text: normalizedText,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: null,
        updatedBy: null,
      });
      transaction.update(ticketRef, {
        latestProgress: nextLatestProgress,
        progressCount: Math.max(0, Number(ticketData.progressCount ?? 0)) + 1,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        revision: Number(expectedRevision) + 1,
      });
      transaction.set(
        auditRef,
        auditData('PROGRESS_ADDED', user.uid, { progressId: progressRef.id }),
      );
    });

    const [progressSnapshot, ticketSnapshot] = await Promise.all([
      getDoc(progressRef),
      getDoc(ticketRef),
    ]);
    const ticket = mapTicketSnapshot(ticketSnapshot);

    return {
      progress: mapProgressSnapshot(progressSnapshot),
      ticketRevision: ticket.revision,
      latestProgress: ticket.latestProgress,
      progressCount: ticket.progressCount,
    };
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}
