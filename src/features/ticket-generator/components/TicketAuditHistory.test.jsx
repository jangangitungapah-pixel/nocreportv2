import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/persistenceService.js', () => ({
  loadTicketRevisionHistory: vi.fn(),
}));

import { loadTicketRevisionHistory } from '../lib/persistenceService.js';
import { TicketAuditHistory } from './TicketAuditHistory.jsx';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('TicketAuditHistory', () => {
  it('loads bounded history and renders compact revision changes', async () => {
    loadTicketRevisionHistory.mockResolvedValue([
      {
        id: 'audit-2',
        type: 'TICKET_UPDATED',
        revisionFrom: 8,
        revisionTo: 9,
        createdAt: new Date('2026-08-26T17:00:00.000Z'),
        details: {
          changes: {
            pic: { from: 'Team A', to: 'Team B' },
            cutPoint: { from: 'KM 20', to: 'KM 24' },
          },
        },
      },
    ]);

    render(<TicketAuditHistory ticketId="ticket-1" enabled limit={99} />);

    expect(await screen.findByText('Revision 8 → 9')).toBeInTheDocument();
    expect(screen.getByText('PIC')).toBeInTheDocument();
    expect(screen.getByText('Team A → Team B')).toBeInTheDocument();
    expect(screen.getByText('Cut Point')).toBeInTheDocument();
    expect(screen.getByText('KM 20 → KM 24')).toBeInTheDocument();
    expect(screen.getByText('1 event')).toBeInTheDocument();
    expect(screen.queryByText(/Immutable audit/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();

    expect(loadTicketRevisionHistory).toHaveBeenCalledWith('ticket-1', { limit: 50 });
  });

  it('keeps legacy TICKET_UPDATED events readable without low-value explanation copy', async () => {
    loadTicketRevisionHistory.mockResolvedValue([
      {
        id: 'legacy-1',
        type: 'TICKET_UPDATED',
        revisionFrom: null,
        revisionTo: null,
        createdAt: new Date('2026-08-20T10:00:00.000Z'),
        details: null,
      },
    ]);

    render(<TicketAuditHistory ticketId="ticket-legacy" enabled />);

    expect(await screen.findByText('Ticket updated')).toBeInTheDocument();
    expect(screen.queryByText(/Legacy update event/i)).not.toBeInTheDocument();
  });

  it('hides opaque progress ids from the visual audit list', async () => {
    loadTicketRevisionHistory.mockResolvedValue([
      {
        id: 'progress-event',
        type: 'PROGRESS_ADDED',
        createdAt: new Date('2026-08-26T17:01:00.000Z'),
        details: { progressId: 'vQR1OQyjpPjzv66MbkWa' },
      },
    ]);

    render(<TicketAuditHistory ticketId="ticket-progress" enabled />);

    expect(await screen.findByText('Progress added')).toBeInTheDocument();
    expect(screen.queryByText(/vQR1OQyjpPjzv66MbkWa/)).not.toBeInTheDocument();
  });

  it('does not query audit history when the capability is disabled', async () => {
    render(<TicketAuditHistory ticketId="ticket-1" enabled={false} />);

    expect(screen.queryByLabelText('Revision history')).not.toBeInTheDocument();
    await waitFor(() => expect(loadTicketRevisionHistory).not.toHaveBeenCalled());
  });
});
