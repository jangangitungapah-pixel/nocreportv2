import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RevisionHistoryPanel } from './RevisionHistoryPanel.jsx';

afterEach(() => {
  cleanup();
});

describe('RevisionHistoryPanel', () => {
  it('renders compact TICKET_UPDATED field diffs with revision boundaries', () => {
    render(
      <RevisionHistoryPanel
        events={[
          {
            id: 'audit-1',
            type: 'TICKET_UPDATED',
            actorUid: 'admin-1',
            revisionFrom: 8,
            revisionTo: 9,
            createdAt: new Date('2026-08-26T17:00:00.000Z'),
            details: {
              changes: {
                pic: { from: 'Team A', to: 'Team B' },
                cutPoint: { from: 'KM 10', to: 'KM 11' },
              },
            },
          },
        ]}
      />,
    );

    expect(screen.getByText(/revision 8 → 9/)).toBeInTheDocument();
    expect(screen.getByText('pic')).toBeInTheDocument();
    expect(screen.getByText('Team A → Team B')).toBeInTheDocument();
    expect(screen.getByText('cutPoint')).toBeInTheDocument();
  });

  it('keeps legacy update events readable when compact diff is absent', () => {
    render(
      <RevisionHistoryPanel
        events={[
          {
            id: 'legacy-1',
            type: 'TICKET_UPDATED',
            actorUid: 'admin-1',
            details: null,
            createdAt: new Date('2026-08-20T10:00:00.000Z'),
          },
        ]}
      />,
    );

    expect(screen.getByText('Ticket updated')).toBeInTheDocument();
    expect(screen.getByText(/Legacy update event/)).toBeInTheDocument();
  });

  it('preserves dedicated status event semantics instead of presenting a field diff', () => {
    render(
      <RevisionHistoryPanel
        events={[
          {
            id: 'status-1',
            type: 'STATUS_CHANGED',
            actorUid: 'admin-1',
            details: { fromStatus: 'RUNNING', toStatus: 'RESOLVED' },
            createdAt: new Date('2026-08-26T18:00:00.000Z'),
          },
        ]}
      />,
    );

    expect(screen.getByText('Status changed')).toBeInTheDocument();
    expect(screen.getByText('RUNNING → RESOLVED')).toBeInTheDocument();
    expect(screen.queryByText(/Legacy update event/)).not.toBeInTheDocument();
  });

  it('shows a compact read-only failure state without exposing backend details', () => {
    render(<RevisionHistoryPanel error={new Error('private backend detail')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Revision history could not be loaded.');
    expect(screen.queryByText('private backend detail')).not.toBeInTheDocument();
  });
});
