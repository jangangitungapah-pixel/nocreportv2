import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/persistenceService.js', () => ({
  loadTicketRevisionHistory: vi.fn(),
}));

import { loadTicketRevisionHistory } from '../lib/persistenceService.js';
import { RevisionHistoryWorkspace } from './RevisionHistoryWorkspace.jsx';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('RevisionHistoryWorkspace', () => {
  it('loads only the bounded latest 50 audit events', async () => {
    loadTicketRevisionHistory.mockResolvedValue([
      {
        id: 'audit-1',
        type: 'TICKET_UPDATED',
        revisionFrom: 3,
        revisionTo: 4,
        details: { changes: { pic: { from: 'A', to: 'B' } } },
        createdAt: new Date('2026-08-26T18:00:00.000Z'),
      },
    ]);

    render(<RevisionHistoryWorkspace ticketId="ticket-1" enabled />);

    expect(await screen.findByText(/revision 3 → 4/)).toBeInTheDocument();
    expect(loadTicketRevisionHistory).toHaveBeenCalledWith('ticket-1', { limit: 50 });
  });

  it('does not query audit history when audit capability is unavailable', async () => {
    render(<RevisionHistoryWorkspace ticketId="ticket-1" enabled={false} />);
    expect(screen.queryByText('Revision History')).not.toBeInTheDocument();
    await waitFor(() => expect(loadTicketRevisionHistory).not.toHaveBeenCalled());
  });
});
