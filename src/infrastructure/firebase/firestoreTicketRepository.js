import { TICKET_STATUS } from '../../entities/ticket/index.js';
import { listTicketAuditEvents } from './firestoreAuditQueries.js';
import { removeProgress, updateProgress } from './firestoreProgressMutations.js';
import {
  findDuplicateTicketCandidates,
  getDashboardSummary,
  getTicketById,
  listCutPointTickets,
  listProgress,
  listRunningTickets,
  listTickets,
} from './firestoreTicketQueries.js';
import {
  appendProgress,
  clearCoordinate,
  createTicket,
  saveTicket,
  transitionTicketStatus,
  updateCoordinate,
} from './firestoreTicketMutations.js';

export async function archiveTicket({ ticketId, expectedRevision }) {
  return transitionTicketStatus({
    ticketId,
    expectedRevision,
    toStatus: TICKET_STATUS.ARCHIVED,
  });
}

export async function restoreTicket({
  ticketId,
  expectedRevision,
  toStatus = TICKET_STATUS.RESOLVED,
}) {
  return transitionTicketStatus({ ticketId, expectedRevision, toStatus });
}

export const firestoreTicketRepository = Object.freeze({
  createTicket,
  getTicketById,
  saveTicket,
  transitionTicketStatus,
  listRunningTickets,
  listTickets,
  listCutPointTickets,
  findDuplicateTicketCandidates,
  getDashboardSummary,
  appendProgress,
  updateProgress,
  removeProgress,
  listProgress,
  listTicketAuditEvents,
  updateCoordinate,
  clearCoordinate,
  archiveTicket,
  restoreTicket,
});

export {
  appendProgress,
  clearCoordinate,
  createTicket,
  findDuplicateTicketCandidates,
  getDashboardSummary,
  getTicketById,
  listCutPointTickets,
  listProgress,
  listRunningTickets,
  listTicketAuditEvents,
  listTickets,
  removeProgress,
  saveTicket,
  transitionTicketStatus,
  updateCoordinate,
  updateProgress,
};
