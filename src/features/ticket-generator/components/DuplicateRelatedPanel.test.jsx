import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { DuplicateRelatedPanel } from './DuplicateRelatedPanel.jsx';

function candidate(overrides = {}) {
  return {
    id: 'ticket-existing',
    externalTtNumber: 'INC-20260826-00000001',
    incidentKey: 'INC-20260826-00000001',
    status: 'RUNNING',
    occurAt: new Date('2026-08-26T12:00:00.000Z'),
    updatedAt: new Date('2026-08-26T12:10:00.000Z'),
    duplicateEvidence: {
      level: 'critical',
      score: 190,
      reasons: [
        { code: 'EXACT_EXTERNAL_TT', label: 'Exact external TT match' },
        { code: 'SAME_INCIDENT_KEY', label: 'Same canonical incident identity' },
      ],
    },
    ...overrides,
  };
}

function renderPanel(props = {}) {
  return render(
    <MemoryRouter>
      <DuplicateRelatedPanel
        candidates={[candidate()]}
        onCreateAnyway={vi.fn()}
        onRelate={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('DuplicateRelatedPanel', () => {
  it('shows explicit duplicate reasons and keeps review/create-anyway actions operator controlled', () => {
    const onCreateAnyway = vi.fn();
    renderPanel({ onCreateAnyway });

    expect(screen.getByText('Exact external TT match')).toBeInTheDocument();
    expect(screen.getByText('Same canonical incident identity')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review existing Ticket' })).toHaveAttribute(
      'href',
      '/tickets/ticket-existing',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create anyway' }));
    expect(onCreateAnyway).toHaveBeenCalledTimes(1);
  });

  it('only exposes Link as related for persisted Tickets and disables it while edits are unsaved', () => {
    const onRelate = vi.fn();
    const { rerender } = renderPanel({ canRelate: false, onRelate });
    expect(screen.queryByRole('button', { name: 'Link as related' })).not.toBeInTheDocument();
    expect(screen.getByText('Save this Ticket first to link incidents.')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <DuplicateRelatedPanel
          candidates={[candidate()]}
          canCreateAnyway={false}
          canRelate
          hasUnsavedChanges
          onCreateAnyway={vi.fn()}
          onRelate={onRelate}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Link as related' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Create anyway' })).not.toBeInTheDocument();
  });

  it('renders bounded related Ticket review and explicit unlink action', () => {
    const onUnlinkCurrent = vi.fn();
    renderPanel({
      candidates: [],
      relatedGroup: {
        id: 'group-1',
        ticketIds: ['current-ticket', 'related-ticket'],
      },
      relatedTickets: [
        candidate({
          id: 'related-ticket',
          externalTtNumber: 'INC-20260826-00000002',
          duplicateEvidence: undefined,
        }),
      ],
      onUnlinkCurrent,
    });

    expect(screen.getByText(/Group group-1/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute(
      'href',
      '/tickets/related-ticket',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Unlink current Ticket' }));
    expect(onUnlinkCurrent).toHaveBeenCalledTimes(1);
  });
});
