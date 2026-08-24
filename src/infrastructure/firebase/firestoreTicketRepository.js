import { TICKET_STATUS } from '../../entities/ticket/index.js';
import { removeProgress, updateProgress } from './firestoreProgressMutations.js';
import {
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
  getDashboardSummary,
  appendProgress,
  updateProgress,
  removeProgress,
  listProgress,
  updateCoordinate,
  clearCoordinate,
  archiveTicket,
  restoreTicket,
});

export {
  appendProgress,
  clearCoordinate,
  createTicket,
  getDashboardSummary,
  getTicketById,
  listCutPointTickets,
  listProgress,
  listRunningTickets,
  listTickets,
  removeProgress,
  saveTicket,
  transitionTicketStatus,
  updateCoordinate,
  updateProgress,
};
