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

function normalizedLookupValue(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function dateMillis(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function addSnapshotsToCandidateMap(candidateMap, snapshots, excludeTicketId) {
  for (const snapshot of snapshots) {
    for (const ticketSnapshot of snapshot.docs) {
      if (ticketSnapshot.id === excludeTicketId || candidateMap.has(ticketSnapshot.id)) continue;
      candidateMap.set(ticketSnapshot.id, mapTicketSnapshot(ticketSnapshot));
    }
  }
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

export async function findDuplicateTicketCandidates({
  ticket,
  excludeTicketId = null,
  limit = 24,
  recentWindowHours = 24,
} = {}) {
  try {
    if (!ticket) return [];

    const db = getFirestoreClient();
    const tickets = collection(db, 'tickets');
    const pageSize = boundedLimit(limit, 24, 40);
    const candidateMap = new Map();
    const primaryQueries = [];

    const externalTtNumber = normalizedLookupValue(ticket.externalTtNumber);
    const incidentKey = normalizedLookupValue(ticket.incidentKey);
    const pathKey = normalizedLookupValue(ticket.pathKey);

    if (externalTtNumber) {
      primaryQueries.push(
        getDocs(
          query(
            tickets,
            where('externalTtNumber', '==', externalTtNumber),
            firestoreLimit(Math.min(pageSize, 6)),
          ),
        ),
      );
    }

    if (incidentKey) {
      primaryQueries.push(
        getDocs(
          query(
            tickets,
            where('incidentKey', '==', incidentKey),
            firestoreLimit(Math.min(pageSize, 8)),
          ),
        ),
      );
    }

    if (pathKey) {
      primaryQueries.push(
        getDocs(
          query(
            tickets,
            where('pathKey', '==', pathKey),
            orderBy('updatedAt', 'desc'),
            firestoreLimit(Math.min(pageSize, 16)),
          ),
        ),
      );
    }

    if (primaryQueries.length > 0) {
      const snapshots = await Promise.all(primaryQueries);
      addSnapshotsToCandidateMap(candidateMap, snapshots, excludeTicketId);
    }

    if (candidateMap.size < pageSize) {
      const anchorMs = dateMillis(ticket.occurAt) ?? Date.now();
      const windowMs = Math.max(1, Math.min(Number(recentWindowHours) || 24, 72)) * 60 * 60 * 1000;
      const floor = new Date(anchorMs - windowMs);
      const ceiling = new Date(anchorMs + windowMs);
      const recentSnapshot = await getDocs(
        query(
          tickets,
          where('occurAt', '>=', floor),
          where('occurAt', '<=', ceiling),
          orderBy('occurAt', 'desc'),
          firestoreLimit(pageSize),
        ),
      );
      addSnapshotsToCandidateMap(candidateMap, [recentSnapshot], excludeTicketId);
    }

    return [...candidateMap.values()].slice(0, pageSize);
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
    const normalizedStatuses = Array.isArray(statuses) ? [...new Set(statuses)].slice(0, 10) : [];
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
      orderBy('resolvedAt', 'asc'),
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
