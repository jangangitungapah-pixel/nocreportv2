import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import { getAuthClient } from './authClient.js';
import { createInfrastructureError, normalizeFirebaseError } from './firebaseErrors.js';
import { getFirestoreClient } from './firestoreClient.js';
import { mapProgressSnapshot, mapTicketSnapshot, timestampMillis } from './firestoreMappers.js';

function requireCurrentUser() {
  const user = getAuthClient().currentUser;
  if (!user) {
    throw createInfrastructureError('NOT_AUTHENTICATED', 'Sign in before modifying progress.');
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

function validateProgressInput(occurredAt, text) {
  const normalizedText = String(text ?? '').trim();
  const occurredDate = occurredAt instanceof Date ? occurredAt : new Date(occurredAt);
  if (!normalizedText || Number.isNaN(occurredDate.getTime())) {
    throw createInfrastructureError('VALIDATION_ERROR', 'Progress requires a valid time and text.');
  }
  return { normalizedText, occurredDate };
}

function summary(progressId, occurredAt, text) {
  return { progressId, occurredAt, text };
}

async function getLatestOtherProgress(db, ticketId, excludedProgressId) {
  const snapshot = await getDocs(
    query(
      collection(db, 'tickets', ticketId, 'progress'),
      orderBy('occurredAt', 'desc'),
      orderBy('createdAt', 'desc'),
      orderBy(documentId(), 'desc'),
      firestoreLimit(2),
    ),
  );

  const candidate = snapshot.docs.find((item) => item.id !== excludedProgressId);
  if (!candidate) return null;
  const data = candidate.data();
  return summary(candidate.id, data.occurredAt, data.text ?? '');
}

function latestBetween(left, right) {
  if (!left) return right;
  if (!right) return left;
  return timestampMillis(left.occurredAt) >= timestampMillis(right.occurredAt) ? left : right;
}

export async function updateProgress({ ticketId, progressId, expectedRevision, occurredAt, text }) {
  try {
    const { normalizedText, occurredDate } = validateProgressInput(occurredAt, text);
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const fallbackLatest = await getLatestOtherProgress(db, ticketId, progressId);
    const ticketRef = doc(db, 'tickets', ticketId);
    const progressRef = doc(ticketRef, 'progress', progressId);

    await runTransaction(db, async (transaction) => {
      const [ticketSnapshot, progressSnapshot] = await Promise.all([
        transaction.get(ticketRef),
        transaction.get(progressRef),
      ]);
      if (!ticketSnapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
          details: { ticketId },
        });
      }
      if (!progressSnapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Progress entry does not exist.', {
          details: { ticketId, progressId },
        });
      }

      const ticketData = ticketSnapshot.data();
      assertExpectedRevision(ticketData, expectedRevision, ticketId);
      const updatedSummary = summary(progressId, occurredDate, normalizedText);
      const currentLatest = ticketData.latestProgress ?? null;
      const nextLatest =
        currentLatest?.progressId === progressId
          ? latestBetween(updatedSummary, fallbackLatest)
          : latestBetween(currentLatest, updatedSummary);
      const auditRef = doc(collection(ticketRef, 'auditEvents'));

      transaction.update(progressRef, {
        occurredAt: occurredDate,
        text: normalizedText,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      transaction.update(ticketRef, {
        latestProgress: nextLatest,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        revision: Number(expectedRevision) + 1,
      });
      transaction.set(auditRef, {
        type: 'PROGRESS_UPDATED',
        actorUid: user.uid,
        details: { progressId },
        createdAt: serverTimestamp(),
      });
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

export async function removeProgress({ ticketId, progressId, expectedRevision }) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const fallbackLatest = await getLatestOtherProgress(db, ticketId, progressId);
    const ticketRef = doc(db, 'tickets', ticketId);
    const progressRef = doc(ticketRef, 'progress', progressId);

    await runTransaction(db, async (transaction) => {
      const [ticketSnapshot, progressSnapshot] = await Promise.all([
        transaction.get(ticketRef),
        transaction.get(progressRef),
      ]);
      if (!ticketSnapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
          details: { ticketId },
        });
      }
      if (!progressSnapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Progress entry does not exist.', {
          details: { ticketId, progressId },
        });
      }

      const ticketData = ticketSnapshot.data();
      assertExpectedRevision(ticketData, expectedRevision, ticketId);
      const currentLatest = ticketData.latestProgress ?? null;
      const auditRef = doc(collection(ticketRef, 'auditEvents'));

      transaction.delete(progressRef);
      transaction.update(ticketRef, {
        latestProgress: currentLatest?.progressId === progressId ? fallbackLatest : currentLatest,
        progressCount: Math.max(0, Number(ticketData.progressCount ?? 0) - 1),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        revision: Number(expectedRevision) + 1,
      });
      transaction.set(auditRef, {
        type: 'PROGRESS_REMOVED',
        actorUid: user.uid,
        details: { progressId },
        createdAt: serverTimestamp(),
      });
    });

    const ticketSnapshot = await getDoc(ticketRef);
    const ticket = mapTicketSnapshot(ticketSnapshot);
    return {
      ticketRevision: ticket.revision,
      latestProgress: ticket.latestProgress,
      progressCount: ticket.progressCount,
    };
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}
