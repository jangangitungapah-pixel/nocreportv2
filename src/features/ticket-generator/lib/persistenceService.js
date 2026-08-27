import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';

const MAX_EDITOR_PROGRESS = 1000;
const MAX_REVISION_HISTORY = 50;

function coordinateSignature(coordinate) {
  if (!coordinate) return 'none';
  return [
    coordinate.latitude,
    coordinate.longitude,
    coordinate.source ?? 'manual',
    coordinate.detectedFormat ?? '',
  ].join('|');
}

async function loadAllProgress(ticketId) {
  const items = [];
  let cursor = null;

  do {
    const page = await firestoreTicketRepository.listProgress({
      ticketId,
      pageSize: Math.min(100, MAX_EDITOR_PROGRESS - items.length),
      cursor,
      direction: 'asc',
    });
    items.push(...page.items);
    cursor = page.hasMore && items.length < MAX_EDITOR_PROGRESS ? page.nextCursor : null;
  } while (cursor);

  return items;
}

export async function loadTicketEditor(ticketId) {
  const [ticket, progress] = await Promise.all([
    firestoreTicketRepository.getTicketById(ticketId),
    loadAllProgress(ticketId),
  ]);
  return { ticket, progress, coordinateSignature: coordinateSignature(ticket.coordinate) };
}

export function loadTicketRevisionHistory(ticketId, { limit = MAX_REVISION_HISTORY } = {}) {
  return firestoreTicketRepository.listTicketAuditEvents({
    ticketId,
    limit: Math.min(Math.max(1, Number(limit) || MAX_REVISION_HISTORY), MAX_REVISION_HISTORY),
  });
}

export async function createTicketEditor(ticket, progressEntries = []) {
  const created = await firestoreTicketRepository.createTicket(ticket);
  let revision = created.ticket.revision;

  for (const entry of progressEntries) {
    const result = await firestoreTicketRepository.appendProgress({
      ticketId: created.ticketId,
      expectedRevision: revision,
      occurredAt: entry.occurredAt,
      text: entry.text,
    });
    revision = result.ticketRevision;
  }

  return { ticketId: created.ticketId, revision };
}

export async function saveTicketEditorCore({
  ticketId,
  expectedRevision,
  ticket,
  previousCoordinateSignature,
}) {
  const saved = await firestoreTicketRepository.saveTicket({
    ticketId,
    expectedRevision,
    patch: {
      schemaVersion: 2,
      title: ticket.title,
      titleMode: ticket.titleMode,
      externalTtNumber: ticket.externalTtNumber,
      templateProfileId: ticket.templateProfileId,
      incidentKey: ticket.incidentKey,
      pathKey: ticket.pathKey,
      alarmContext: ticket.alarmContext,
      importProvenance: ticket.importProvenance,
      incidentGroupId: ticket.incidentGroupId,
      impactList: ticket.impactList,
      occurAt: ticket.occurAt,
      dispatchAt: ticket.dispatchAt,
      pic: ticket.pic,
      rootcause: ticket.rootcause,
      cutPoint: ticket.cutPoint,
    },
  });

  let revision = saved.revision;
  let persistedTicket = saved.ticket;
  const nextCoordinateSignature = coordinateSignature(ticket.coordinate);

  if (nextCoordinateSignature !== previousCoordinateSignature) {
    const coordinateResult = ticket.coordinate
      ? await firestoreTicketRepository.updateCoordinate({
          ticketId,
          expectedRevision: revision,
          coordinate: ticket.coordinate,
        })
      : await firestoreTicketRepository.clearCoordinate({ ticketId, expectedRevision: revision });

    revision = coordinateResult.revision;
    persistedTicket = coordinateResult.ticket;
  }

  return {
    ticket: persistedTicket,
    revision,
    coordinateSignature: coordinateSignature(persistedTicket.coordinate),
  };
}

export function persistTicketTransition({ ticketId, expectedRevision, toStatus }) {
  return firestoreTicketRepository.transitionTicketStatus({ ticketId, expectedRevision, toStatus });
}

export function persistTicketArchive({ ticketId, expectedRevision }) {
  return firestoreTicketRepository.archiveTicket({ ticketId, expectedRevision });
}

export function persistTicketRestore({ ticketId, expectedRevision, toStatus }) {
  return firestoreTicketRepository.restoreTicket({ ticketId, expectedRevision, toStatus });
}

export function persistProgressAppend({ ticketId, expectedRevision, entry }) {
  return firestoreTicketRepository.appendProgress({
    ticketId,
    expectedRevision,
    occurredAt: entry.occurredAt,
    text: entry.text,
  });
}

export function persistProgressUpdate({ ticketId, expectedRevision, entry }) {
  return firestoreTicketRepository.updateProgress({
    ticketId,
    progressId: entry.id,
    expectedRevision,
    occurredAt: entry.occurredAt,
    text: entry.text,
  });
}

export function persistProgressRemove({ ticketId, expectedRevision, progressId }) {
  return firestoreTicketRepository.removeProgress({ ticketId, progressId, expectedRevision });
}
