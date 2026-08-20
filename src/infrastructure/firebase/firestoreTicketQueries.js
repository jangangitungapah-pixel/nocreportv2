import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';

import { TICKET_STATUS } from '../../entities/ticket/index.js';
import { createInfrastructureError, normalizeFirebaseError } from './firebaseErrors.js';
import { getFirestoreClient } from './firestoreClient.js';
import { mapProgressSnapshot, mapTicketSnapshot } from './firestoreMappers.js';

const OPERATIONAL_STATUSES = Object.freeze([
  TICKET_STATUS.DRAFT,
  TICKET_STATUS.RUNNING,
  TICKET_STATUS.RESOLVED,
]);

function boundedLimit(value, fallback, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maximum);
}

function pageResult(snapshot, pageSize, mapper) {
  const docs = snapshot.docs.slice(0, pageSize);
  const hasMore = snapshot.docs.length > pageSize;
  return {
    items: docs.map(mapper),
    nextCursor: hasMore ? (docs.at(-1) ?? null) : null,
    hasMore,
  };
}

export async function getTicketById(ticketId) {
  try {
    const db = getFirestoreClient();
    const snapshot = await getDoc(doc(db, 'tickets', ticketId));
    if (!snapshot.exists()) {
      throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
        details: { ticketId },
      });
    }
    return mapTicketSnapshot(snapshot);
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}

export async function listRunningTickets({ limit = 100 } = {}) {
  try {
    const db = getFirestoreClient();
    const pageSize = boundedLimit(limit, 100, 200);
    const snapshot = await getDocs(
      query(
        collection(db, 'tickets'),
        where('status', '==', TICKET_STATUS.RUNNING),
        orderBy('updatedAt', 'desc'),
        firestoreLimit(pageSize),
      ),
    );
    return snapshot.docs.map(mapTicketSnapshot);
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}

export async function listTickets({
  statuses = OPERATIONAL_STATUSES,
  limit = 50,
  cursor = null,
} = {}) {
  try {
    const db = getFirestoreClient();
    const pageSize = boundedLimit(limit, 50, 100);
    const constraints = [];

    if (Array.isArray(statuses) && statuses.length > 0) {
      const normalizedStatuses = [...new Set(statuses)].slice(0, 10);
      constraints.push(
        normalizedStatuses.length === 1
          ? where('status', '==', normalizedStatuses[0])
          : where('status', 'in', normalizedStatuses),
      );
    }

    constraints.push(orderBy('updatedAt', 'desc'));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(firestoreLimit(pageSize + 1));

    const snapshot = await getDocs(query(collection(db, 'tickets'), ...constraints));
    return pageResult(snapshot, pageSize, mapTicketSnapshot);
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}

export async function listCutPointTickets({
  statuses = [TICKET_STATUS.RUNNING, TICKET_STATUS.RESOLVED],
  limit = 500,
} = {}) {
  try {
    const db = getFirestoreClient();
    const pageSize = boundedLimit(limit, 500, 500);
    const normalizedStatuses = Array.isArray(statuses)
      ? [...new Set(statuses)].slice(0, 10)
      : [];
    const constraints = [where('hasCoordinates', '==', true)];

    if (normalizedStatuses.length === 1) {
      constraints.push(where('status', '==', normalizedStatuses[0]));
    } else if (normalizedStatuses.length > 1) {
      constraints.push(where('status', 'in', normalizedStatuses));
    }

    constraints.push(orderBy('updatedAt', 'desc'), firestoreLimit(pageSize));
    const snapshot = await getDocs(query(collection(db, 'tickets'), ...constraints));

    return snapshot.docs
      .map(mapTicketSnapshot)
      .filter(
        (ticket) =>
          Number.isFinite(ticket.coordinate?.latitude) &&
          Number.isFinite(ticket.coordinate?.longitude),
      );
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}

export async function listProgress({
  ticketId,
  pageSize = 100,
  cursor = null,
  direction = 'asc',
} = {}) {
  try {
    const db = getFirestoreClient();
    const size = boundedLimit(pageSize, 100, 200);
    const orderDirection = direction === 'desc' ? 'desc' : 'asc';
    const constraints = [
      orderBy('occurredAt', orderDirection),
      orderBy('createdAt', orderDirection),
      orderBy(documentId(), orderDirection),
    ];
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(firestoreLimit(size + 1));

    const snapshot = await getDocs(
      query(collection(db, 'tickets', ticketId, 'progress'), ...constraints),
    );
    return pageResult(snapshot, size, mapProgressSnapshot);
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function getDashboardSummary() {
  try {
    const db = getFirestoreClient();
    const tickets = collection(db, 'tickets');
    const today = startOfLocalDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const runningQuery = query(tickets, where('status', '==', TICKET_STATUS.RUNNING));
    const todayQuery = query(
      tickets,
      where('occurAt', '>=', today),
      where('occurAt', '<', tomorrow),
    );
    const resolvedTodayQuery = query(
      tickets,
      where('status', '==', TICKET_STATUS.RESOLVED),
      where('resolvedAt', '>=', today),
      where('resolvedAt', '<', tomorrow),
    );
    const cutPointQuery = query(tickets, where('hasCoordinates', '==', true));
    const recentQuery = query(
      tickets,
      where('status', 'in', OPERATIONAL_STATUSES),
      orderBy('updatedAt', 'desc'),
      firestoreLimit(8),
    );

    const [running, todayCount, resolvedToday, cutPoints, recent] = await Promise.all([
      getCountFromServer(runningQuery),
      getCountFromServer(todayQuery),
      getCountFromServer(resolvedTodayQuery),
      getCountFromServer(cutPointQuery),
      getDocs(recentQuery),
    ]);

    return {
      runningCount: running.data().count,
      ticketsTodayCount: todayCount.data().count,
      resolvedTodayCount: resolvedToday.data().count,
      cutPointCount: cutPoints.data().count,
      recentlyUpdated: recent.docs.map(mapTicketSnapshot),
    };
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}
