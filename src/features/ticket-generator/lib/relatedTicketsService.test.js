import { beforeEach, describe, expect, it, vi } from 'vitest';

const incidentGroupMocks = vi.hoisted(() => ({
  createIncidentGroupFromTickets: vi.fn(),
  linkTicketToIncidentGroup: vi.fn(),
  listRelatedTickets: vi.fn(),
  unlinkTicketFromIncidentGroup: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/firestoreIncidentGroups.js', () => ({
  createIncidentGroupFromTickets: incidentGroupMocks.createIncidentGroupFromTickets,
  linkTicketToIncidentGroup: incidentGroupMocks.linkTicketToIncidentGroup,
  listRelatedTickets: incidentGroupMocks.listRelatedTickets,
  unlinkTicketFromIncidentGroup: incidentGroupMocks.unlinkTicketFromIncidentGroup,
}));

import {
  loadRelatedTickets,
  relateTicketToCandidate,
  unlinkCurrentTicketFromGroup,
} from './relatedTicketsService.js';

function persistedTicket(overrides = {}) {
  return {
    id: 'ticket-current',
    revision: 7,
    externalTtNumber: 'INC-20260826-00000001',
    pathKey: 'NODE_A<>NODE_B',
    incidentGroupId: null,
    ...overrides,
  };
}

function candidateTicket(overrides = {}) {
  return persistedTicket({
    id: 'ticket-candidate',
    revision: 3,
    externalTtNumber: 'INC-20260826-00000002',
    ...overrides,
  });
}

describe('GEN-F5 related ticket service', () => {
  beforeEach(() => {
    for (const mock of Object.values(incidentGroupMocks)) mock.mockReset();
  });

  it('joins the candidate to the current Ticket group with the candidate revision', async () => {
    const currentTicket = persistedTicket({ incidentGroupId: 'group-current' });
    const candidate = candidateTicket();
    incidentGroupMocks.linkTicketToIncidentGroup.mockResolvedValue({ id: 'group-current' });

    await expect(relateTicketToCandidate({ currentTicket, candidate })).resolves.toEqual({
      id: 'group-current',
    });

    expect(incidentGroupMocks.linkTicketToIncidentGroup).toHaveBeenCalledWith({
      groupId: 'group-current',
      ticketId: candidate.id,
      expectedRevision: candidate.revision,
    });
    expect(incidentGroupMocks.createIncidentGroupFromTickets).not.toHaveBeenCalled();
  });

  it('joins the current Ticket to the candidate group with the current revision', async () => {
    const currentTicket = persistedTicket();
    const candidate = candidateTicket({ incidentGroupId: 'group-candidate' });
    incidentGroupMocks.linkTicketToIncidentGroup.mockResolvedValue({ id: 'group-candidate' });

    await relateTicketToCandidate({ currentTicket, candidate });

    expect(incidentGroupMocks.linkTicketToIncidentGroup).toHaveBeenCalledWith({
      groupId: 'group-candidate',
      ticketId: currentTicket.id,
      expectedRevision: currentTicket.revision,
    });
    expect(incidentGroupMocks.createIncidentGroupFromTickets).not.toHaveBeenCalled();
  });

  it('creates a new group when neither Ticket is already related', async () => {
    const currentTicket = persistedTicket();
    const candidate = candidateTicket({ pathKey: 'NODE_C<>NODE_D' });
    incidentGroupMocks.createIncidentGroupFromTickets.mockResolvedValue({ id: 'group-new' });

    await relateTicketToCandidate({ currentTicket, candidate });

    expect(incidentGroupMocks.createIncidentGroupFromTickets).toHaveBeenCalledWith({
      members: [
        { ticketId: currentTicket.id, expectedRevision: currentTicket.revision },
        { ticketId: candidate.id, expectedRevision: candidate.revision },
      ],
      title: 'Related incident INC-20260826-00000001',
      pathKey: currentTicket.pathKey,
    });
    expect(incidentGroupMocks.linkTicketToIncidentGroup).not.toHaveBeenCalled();
  });

  it('rejects Tickets that already belong to different groups without mutating either group', async () => {
    const currentTicket = persistedTicket({ incidentGroupId: 'group-current' });
    const candidate = candidateTicket({ incidentGroupId: 'group-other' });

    await expect(relateTicketToCandidate({ currentTicket, candidate })).rejects.toThrow(
      'different incident group',
    );

    expect(incidentGroupMocks.linkTicketToIncidentGroup).not.toHaveBeenCalled();
    expect(incidentGroupMocks.createIncidentGroupFromTickets).not.toHaveBeenCalled();
  });

  it('loads bounded related Tickets and excludes the current Ticket', async () => {
    incidentGroupMocks.listRelatedTickets.mockResolvedValue({
      group: { id: 'group-1' },
      tickets: [{ id: 'ticket-related' }],
    });

    await loadRelatedTickets('group-1', 'ticket-current');

    expect(incidentGroupMocks.listRelatedTickets).toHaveBeenCalledWith({
      groupId: 'group-1',
      excludeTicketId: 'ticket-current',
      limit: 20,
    });
  });

  it('unlinks only through the current Ticket revision-safe repository boundary', async () => {
    const currentTicket = persistedTicket({ incidentGroupId: 'group-1' });
    incidentGroupMocks.unlinkTicketFromIncidentGroup.mockResolvedValue({ id: 'group-1' });

    await unlinkCurrentTicketFromGroup(currentTicket);

    expect(incidentGroupMocks.unlinkTicketFromIncidentGroup).toHaveBeenCalledWith({
      groupId: 'group-1',
      ticketId: currentTicket.id,
      expectedRevision: currentTicket.revision,
    });
  });
});
