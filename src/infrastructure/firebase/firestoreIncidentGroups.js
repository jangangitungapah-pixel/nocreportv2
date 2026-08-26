import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { getAuthClient } from './authClient.js';
import { createInfrastructureError, normalizeFirebaseError } from './firebaseErrors.js';
import { getFirestoreClient } from './firestoreClient.js';
import { mapTicketSnapshot, toDate } from './firestoreMappers.js';

const MAX_GROUP_MEMBERS = 20;

function requireCurrentUser() {
  const user = getAuthClient().currentUser;
  if (!user) {
    throw createInfrastructureError('NOT_AUTHENTICATED', 'Sign in before modifying related Tickets.');
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

function normalizeMemberInputs(members) {
  const seen = new Set();
  return (Array.isArray(members) ? members : [])
    .map((member) => ({
      ticketId: String(member?.ticketId ?? '').trim(),
      expectedRevision: Number(member?.expectedRevision),
    }))
    .filter((member) => {
      if (!member.ticketId || !Number.isInteger(member.expectedRevision) || seen.has(member.ticketId)) {
        return false;
      }
      seen.add(member.ticketId);
      return true;
    });
}

function mapIncidentGroup(snapshot) {
  if (!snapshot?.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title ?? '',
    pathKey: data.pathKey ?? null,
    ticketIds: Array.isArray(data.ticketIds) ? data.ticketIds.slice(0, MAX_GROUP_MEMBERS) : [],
    createdAt: toDate(data.createdAt),
    createdBy: data.createdBy ?? null,
    updatedAt: toDate(data.updatedAt),
    updatedBy: data.updatedBy ?? null,
  };
}

function auditData(type, actorUid, details) {
  return {
    type,
    actorUid,
    details,
    createdAt: serverTimestamp(),
  };
}

export async function getIncidentGroup(groupId) {
  try {
    const db = getFirestoreClient();
    const snapshot = await getDoc(doc(db, 'incidentGroups', groupId));
    if (!snapshot.exists()) {
      throw createInfrastructureError('NOT_FOUND', 'Incident group does not exist.', {
        details: { groupId },
      });
    }
    return mapIncidentGroup(snapshot);
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}

export async function listRelatedTickets({ groupId, excludeTicketId = null, limit = 20 } = {}) {
  try {
    const db = getFirestoreClient();
    const group = await getIncidentGroup(groupId);
    const pageSize = Math.max(1, Math.min(Number(limit) || 20, MAX_GROUP_MEMBERS));
    const ids = group.ticketIds.filter((id) => id !== excludeTicketId).slice(0, pageSize);
    if (ids.length === 0) return { group, tickets: [] };

    const chunks = [];
    for (let index = 0; index < ids.length; index += 10) chunks.push(ids.slice(index, index + 10));
    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        getDocs(query(collection(db, 'tickets'), where(documentId(), 'in', chunk))),
      ),
    );

    const ticketMap = new Map();
    for (const snapshot of snapshots) {
      for (const ticketSnapshot of snapshot.docs) {
        ticketMap.set(ticketSnapshot.id, mapTicketSnapshot(ticketSnapshot));
      }
    }

    return {
      group,
      tickets: ids.map((id) => ticketMap.get(id)).filter(Boolean),
    };
  } catch (error) {
    throw normalizeFirebaseError(error, 'QUERY_ERROR');
  }
}

export async function createIncidentGroupFromTickets({ members, title = '', pathKey = null } = {}) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const normalizedMembers = normalizeMemberInputs(members);
    if (normalizedMembers.length < 2 || normalizedMembers.length > MAX_GROUP_MEMBERS) {
      throw createInfrastructureError(
        'VALIDATION_ERROR',
        'An incident group requires between 2 and 20 unique Tickets.',
      );
    }

    const groupRef = doc(collection(db, 'incidentGroups'));
    await runTransaction(db, async (transaction) => {
      const snapshots = [];
      for (const member of normalizedMembers) {
        const ticketRef = doc(db, 'tickets', member.ticketId);
        const snapshot = await transaction.get(ticketRef);
        if (!snapshot.exists()) {
          throw createInfrastructureError('NOT_FOUND', 'A related Ticket does not exist.', {
            details: { ticketId: member.ticketId },
          });
        }
        assertExpectedRevision(snapshot.data(), member.expectedRevision, member.ticketId);
        if (snapshot.data().incidentGroupId) {
          throw createInfrastructureError('ALREADY_RELATED', 'A Ticket already belongs to an incident group.', {
            details: { ticketId: member.ticketId, groupId: snapshot.data().incidentGroupId },
          });
        }
        snapshots.push({ member, ticketRef, snapshot });
      }

      transaction.set(groupRef, {
        title: String(title ?? '').trim(),
        pathKey: pathKey ? String(pathKey).trim() : null,
        ticketIds: normalizedMembers.map((member) => member.ticketId),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      for (const { member, ticketRef, snapshot } of snapshots) {
        transaction.update(ticketRef, {
          incidentGroupId: groupRef.id,
          revision: Number(snapshot.data().revision) + 1,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
        transaction.set(doc(collection(ticketRef, 'auditEvents')), {
          ...auditData('INCIDENT_GROUP_LINKED', user.uid, {
            groupId: groupRef.id,
            relatedTicketIds: normalizedMembers
              .map((item) => item.ticketId)
              .filter((ticketId) => ticketId !== member.ticketId),
          }),
        });
      }
    });

    return getIncidentGroup(groupRef.id);
  } catch (error) {
    throw normalizeFirebaseError(error, 'MUTATION_ERROR');
  }
}

export async function linkTicketToIncidentGroup({ groupId, ticketId, expectedRevision } = {}) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const groupRef = doc(db, 'incidentGroups', groupId);
    const ticketRef = doc(db, 'tickets', ticketId);

    await runTransaction(db, async (transaction) => {
      const groupSnapshot = await transaction.get(groupRef);
      const ticketSnapshot = await transaction.get(ticketRef);
      if (!groupSnapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Incident group does not exist.', {
          details: { groupId },
        });
      }
      if (!ticketSnapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Ticket does not exist.', {
          details: { ticketId },
        });
      }

      const groupData = groupSnapshot.data();
      const ticketData = ticketSnapshot.data();
      assertExpectedRevision(ticketData, expectedRevision, ticketId);
      if (ticketData.incidentGroupId && ticketData.incidentGroupId !== groupId) {
        throw createInfrastructureError('ALREADY_RELATED', 'Ticket already belongs to another incident group.', {
          details: { ticketId, groupId: ticketData.incidentGroupId },
        });
      }

      const ticketIds = Array.isArray(groupData.ticketIds) ? [...groupData.ticketIds] : [];
      if (ticketIds.includes(ticketId)) return;
      if (ticketIds.length >= MAX_GROUP_MEMBERS) {
        throw createInfrastructureError('GROUP_LIMIT', 'Incident group already has 20 Tickets.');
      }

      transaction.update(groupRef, {
        ticketIds: [...ticketIds, ticketId],
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      transaction.update(ticketRef, {
        incidentGroupId: groupId,
        revision: Number(ticketData.revision) + 1,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      transaction.set(doc(collection(ticketRef, 'auditEvents')), {
        ...auditData('INCIDENT_GROUP_LINKED', user.uid, { groupId }),
      });
    });

    return getIncidentGroup(groupId);
  } catch (error) {
    throw normalizeFirebaseError(error, 'MUTATION_ERROR');
  }
}

export async function unlinkTicketFromIncidentGroup({ groupId, ticketId, expectedRevision } = {}) {
  try {
    const db = getFirestoreClient();
    const user = requireCurrentUser();
    const groupRef = doc(db, 'incidentGroups', groupId);
    const ticketRef = doc(db, 'tickets', ticketId);

    await runTransaction(db, async (transaction) => {
      const groupSnapshot = await transaction.get(groupRef);
      const ticketSnapshot = await transaction.get(ticketRef);
      if (!groupSnapshot.exists() || !ticketSnapshot.exists()) {
        throw createInfrastructureError('NOT_FOUND', 'Incident group or Ticket does not exist.', {
          details: { groupId, ticketId },
        });
      }

      const groupData = groupSnapshot.data();
      const ticketData = ticketSnapshot.data();
      assertExpectedRevision(ticketData, expectedRevision, ticketId);
      if (ticketData.incidentGroupId !== groupId) {
        throw createInfrastructureError('VALIDATION_ERROR', 'Ticket is not linked to this incident group.');
      }

      const ticketIds = Array.isArray(groupData.ticketIds) ? [...groupData.ticketIds] : [];
      if (ticketIds.length <= 1) {
        throw createInfrastructureError(
          'VALIDATION_ERROR',
          'The last Ticket cannot be removed from an incident group.',
        );
      }

      transaction.update(groupRef, {
        ticketIds: ticketIds.filter((id) => id !== ticketId),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      transaction.update(ticketRef, {
        incidentGroupId: null,
        revision: Number(ticketData.revision) + 1,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      transaction.set(doc(collection(ticketRef, 'auditEvents')), {
        ...auditData('INCIDENT_GROUP_UNLINKED', user.uid, { groupId }),
      });
    });

    return getIncidentGroup(groupId);
  } catch (error) {
    throw normalizeFirebaseError(error, 'MUTATION_ERROR');
  }
}

export const firestoreIncidentGroupRepository = Object.freeze({
  getIncidentGroup,
  listRelatedTickets,
  createIncidentGroupFromTickets,
  linkTicketToIncidentGroup,
  unlinkTicketFromIncidentGroup,
});
