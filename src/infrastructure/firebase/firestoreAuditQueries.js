import { collection, documentId, getDocs, limit as firestoreLimit, orderBy, query } from 'firebase/firestore';

import { normalizeFirebaseError } from './firebaseErrors.js';
import { getFirestoreClient } from './firestoreClient.js';

function boundedLimit(value, fallback = 50, maximum = 50) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maximum);
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapAuditSnapshot(snapshot) {
  const data = snapshot.data();
  const revisionFrom = Number(data.revisionFrom);
  const revisionTo = Number(data.revisionTo);
  return {
    id: snapshot.id,
    type: String(data.type ?? 'UNKNOWN'),
    actorUid: data.actorUid ?? null,
    details: data.details ?? null,
    revisionFrom: Number.isFinite(revisionFrom) ? revisionFrom : null,
    revisionTo: Number.isFinite(revisionTo) ? revisionTo : null,
    createdAt: toDate(data.createdAt),
  };
}

export async function listTicketAuditEvents({ ticketId, limit = 50 } = {}) {
  try {
    const db = getFirestoreClient();
    const size = boundedLimit(limit);
    const snapshot = await getDocs(
      query(
        collection(db, 'tickets', ticketId, 'auditEvents'),
        orderBy('createdAt', 'desc'),
        orderBy(documentId(), 'desc'),
        firestoreLimit(size),
      ),
    );
    return snapshot.docs.map(mapAuditSnapshot);
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}
