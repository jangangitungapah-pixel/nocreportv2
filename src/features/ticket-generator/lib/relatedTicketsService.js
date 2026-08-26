import {
  createIncidentGroupFromTickets,
  linkTicketToIncidentGroup,
  listRelatedTickets,
  unlinkTicketFromIncidentGroup,
} from '../../../infrastructure/firebase/firestoreIncidentGroups.js';

export async function loadRelatedTickets(groupId, currentTicketId) {
  if (!groupId) return { group: null, tickets: [] };
  return listRelatedTickets({
    groupId,
    excludeTicketId: currentTicketId,
    limit: 20,
  });
}

export async function relateTicketToCandidate({ currentTicket, candidate }) {
  if (!currentTicket?.id || !candidate?.id) {
    throw new Error('Both persisted Tickets are required before creating a relationship.');
  }

  if (currentTicket.incidentGroupId) {
    if (candidate.incidentGroupId && candidate.incidentGroupId !== currentTicket.incidentGroupId) {
      throw new Error('The candidate already belongs to a different incident group.');
    }
    return linkTicketToIncidentGroup({
      groupId: currentTicket.incidentGroupId,
      ticketId: candidate.id,
      expectedRevision: candidate.revision,
    });
  }

  if (candidate.incidentGroupId) {
    return linkTicketToIncidentGroup({
      groupId: candidate.incidentGroupId,
      ticketId: currentTicket.id,
      expectedRevision: currentTicket.revision,
    });
  }

  return createIncidentGroupFromTickets({
    members: [
      { ticketId: currentTicket.id, expectedRevision: currentTicket.revision },
      { ticketId: candidate.id, expectedRevision: candidate.revision },
    ],
    title: currentTicket.externalTtNumber
      ? `Related incident ${currentTicket.externalTtNumber}`
      : 'Related NOC incident',
    pathKey: currentTicket.pathKey ?? candidate.pathKey ?? null,
  });
}

export async function unlinkCurrentTicketFromGroup(currentTicket) {
  if (!currentTicket?.id || !currentTicket?.incidentGroupId) {
    throw new Error('Current Ticket is not linked to an incident group.');
  }
  return unlinkTicketFromIncidentGroup({
    groupId: currentTicket.incidentGroupId,
    ticketId: currentTicket.id,
    expectedRevision: currentTicket.revision,
  });
}
