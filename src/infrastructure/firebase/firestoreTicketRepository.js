import { TICKET_STATUS } from '../../entities/ticket/index.js';
import {
  TICKET_WORKSPACE_SCOPE,
  publishTicketWorkspaceChange,
} from '../../shared/integration/ticketWorkspaceSync.js';
import { listTicketAuditEvents } from './firestoreAuditQueries.js';
import {
  removeProgress as removeProgressMutation,
  updateProgress as updateProgressMutation,
} from './firestoreProgressMutations.js';
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
  appendProgress as appendProgressMutation,
  clearCoordinate as clearCoordinateMutation,
  createTicket as createTicketMutation,
  saveTicket as saveTicketMutation,
  transitionTicketStatus as transitionTicketStatusMutation,
  updateCoordinate as updateCoordinateMutation,
} from './firestoreTicketMutations.js';

const CORE_SCOPES = Object.freeze([
  TICKET_WORKSPACE_SCOPE.DASHBOARD,
  TICKET_WORKSPACE_SCOPE.RUNNING,
  TICKET_WORKSPACE_SCOPE.CUT_POINTS,
  TICKET_WORKSPACE_SCOPE.ARCHIVE,
  TICKET_WORKSPACE_SCOPE.TICKET,
]);

const OPERATIONAL_SCOPES = Object.freeze([
  TICKET_WORKSPACE_SCOPE.DASHBOARD,
  TICKET_WORKSPACE_SCOPE.RUNNING,
  TICKET_WORKSPACE_SCOPE.CUT_POINTS,
  TICKET_WORKSPACE_SCOPE.TICKET,
]);

function mutationTicketId(input, result) {
  return result?.ticketId ?? result?.ticket?.id ?? input?.ticketId ?? input?.id ?? null;
}

function mutationRevision(result) {
  return result?.revision ?? result?.ticketRevision ?? result?.ticket?.revision ?? null;
}

function publishMutation(kind, input, result, scopes = CORE_SCOPES) {
  publishTicketWorkspaceChange({
    kind,
    ticketId: mutationTicketId(input, result),
    revision: mutationRevision(result),
    status: result?.ticket?.status ?? null,
    scopes,
  });
}

export async function createTicket(ticket) {
  const result = await createTicketMutation(ticket);
  publishMutation('ticket-created', ticket, result, CORE_SCOPES);
  return result;
}

export async function saveTicket(input) {
  const result = await saveTicketMutation(input);
  publishMutation('ticket-saved', input, result, CORE_SCOPES);
  return result;
}

export async function transitionTicketStatus(input) {
  const result = await transitionTicketStatusMutation(input);
  publishMutation('ticket-status-changed', input, result, CORE_SCOPES);
  return result;
}

export async function appendProgress(input) {
  const result = await appendProgressMutation(input);
  publishMutation('progress-added', input, result, OPERATIONAL_SCOPES);
  return result;
}

export async function updateProgress(input) {
  const result = await updateProgressMutation(input);
  publishMutation('progress-updated', input, result, OPERATIONAL_SCOPES);
  return result;
}

export async function removeProgress(input) {
  const result = await removeProgressMutation(input);
  publishMutation('progress-removed', input, result, OPERATIONAL_SCOPES);
  return result;
}

export async function updateCoordinate(input) {
  const result = await updateCoordinateMutation(input);
  publishMutation('coordinate-updated', input, result, OPERATIONAL_SCOPES);
  return result;
}

export async function clearCoordinate(input) {
  const result = await clearCoordinateMutation(input);
  publishMutation('coordinate-cleared', input, result, OPERATIONAL_SCOPES);
  return result;
}

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
  findDuplicateTicketCandidates,
  getDashboardSummary,
  getTicketById,
  listCutPointTickets,
  listProgress,
  listRunningTickets,
  listTicketAuditEvents,
  listTickets,
};
