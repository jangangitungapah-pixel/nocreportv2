import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  createTicket: vi.fn(),
  appendProgress: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/index.js', () => ({
  firestoreTicketRepository: {
    createTicket: repositoryMocks.createTicket,
    appendProgress: repositoryMocks.appendProgress,
  },
}));

import { createTicketEditor, persistProgressAppend } from './persistenceService.js';

describe('GEN-F3 Progress persistence boundary', () => {
  beforeEach(() => {
    repositoryMocks.createTicket.mockReset();
    repositoryMocks.appendProgress.mockReset();
  });

  it('forwards the current Ticket revision unchanged for persisted Quick Progress', async () => {
    const entry = {
      occurredAt: new Date('2026-08-26T00:30:00.000Z'),
      text: 'Team arrived at cut point',
    };
    repositoryMocks.appendProgress.mockResolvedValue({ ticketRevision: 8 });

    await expect(
      persistProgressAppend({ ticketId: 'ticket-1', expectedRevision: 7, entry }),
    ).resolves.toEqual({ ticketRevision: 8 });

    expect(repositoryMocks.appendProgress).toHaveBeenCalledWith({
      ticketId: 'ticket-1',
      expectedRevision: 7,
      occurredAt: entry.occurredAt,
      text: entry.text,
    });
  });

  it('propagates stale-revision rejection instead of retrying or bypassing concurrency protection', async () => {
    repositoryMocks.appendProgress.mockRejectedValue({ code: 'STALE_REVISION' });

    await expect(
      persistProgressAppend({
        ticketId: 'ticket-1',
        expectedRevision: 3,
        entry: {
          occurredAt: new Date('2026-08-26T01:00:00.000Z'),
          text: 'Concurrent update',
        },
      }),
    ).rejects.toMatchObject({ code: 'STALE_REVISION' });

    expect(repositoryMocks.appendProgress).toHaveBeenCalledTimes(1);
  });

  it('creates a new Ticket before persisting its local Progress draft and chains revisions', async () => {
    const ticket = { title: '[MANDAU] NEW TICKET' };
    const first = {
      occurredAt: new Date('2026-08-26T02:00:00.000Z'),
      text: 'First local update',
    };
    const second = {
      occurredAt: new Date('2026-08-26T02:15:00.000Z'),
      text: 'Second local update',
    };

    repositoryMocks.createTicket.mockResolvedValue({
      ticketId: 'ticket-new',
      ticket: { id: 'ticket-new', revision: 1 },
    });
    repositoryMocks.appendProgress
      .mockResolvedValueOnce({ ticketRevision: 2 })
      .mockResolvedValueOnce({ ticketRevision: 3 });

    await expect(createTicketEditor(ticket, [first, second])).resolves.toEqual({
      ticketId: 'ticket-new',
      revision: 3,
    });

    expect(repositoryMocks.createTicket).toHaveBeenCalledWith(ticket);
    expect(repositoryMocks.appendProgress).toHaveBeenNthCalledWith(1, {
      ticketId: 'ticket-new',
      expectedRevision: 1,
      occurredAt: first.occurredAt,
      text: first.text,
    });
    expect(repositoryMocks.appendProgress).toHaveBeenNthCalledWith(2, {
      ticketId: 'ticket-new',
      expectedRevision: 2,
      occurredAt: second.occurredAt,
      text: second.text,
    });
  });
});
