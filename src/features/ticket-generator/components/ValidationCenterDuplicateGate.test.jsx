import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const findDuplicateCandidates = vi.fn();

vi.mock('../../../infrastructure/firebase/authClient.js', () => ({
  getAuthClient: () => ({ currentUser: { uid: 'operator-1' } }),
}));

vi.mock('../lib/duplicateDetectionService.js', () => ({
  findDuplicateCandidates: (...args) => findDuplicateCandidates(...args),
}));

vi.mock('../lib/relatedTicketsService.js', () => ({
  loadRelatedTickets: vi.fn(),
  relateTicketToCandidate: vi.fn(),
  unlinkCurrentTicketFromGroup: vi.fn(),
}));

import { ValidationCenter } from './ValidationCenter.jsx';

function validation() {
  return {
    ticket: {
      title: '[MANDAU] LINK DOWN AT DWDM NODE_A <> NODE_B [TT : INC-20260826-00000001]',
      externalTtNumber: 'INC-20260826-00000001',
      incidentKey: 'INC-20260826-00000001',
      pathKey: 'NODE_A<>NODE_B',
      occurAt: new Date('2026-08-26T12:00:00.000Z'),
      revision: 0,
      alarmContext: { siteId: '', alarmFamily: null },
    },
    readyForRunning: true,
    counts: { blocking: 0, warning: 0, info: 0 },
    time: { timezone: 'Asia/Jakarta' },
    findings: [],
  };
}

function duplicateCandidate() {
  return {
    id: 'ticket-existing',
    externalTtNumber: 'INC-20260826-00000001',
    incidentKey: 'INC-20260826-00000001',
    status: 'RUNNING',
    occurAt: new Date('2026-08-26T12:00:00.000Z'),
    updatedAt: new Date('2026-08-26T12:05:00.000Z'),
    revision: 4,
    duplicateEvidence: {
      level: 'critical',
      score: 190,
      reasons: [{ code: 'EXACT_EXTERNAL_TT', label: 'Exact external TT match' }],
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  findDuplicateCandidates.mockReset();
  findDuplicateCandidates.mockResolvedValue([duplicateCandidate()]);
  window.history.replaceState({}, '', '/generator/new');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('GEN-F5 ValidationCenter duplicate create gate', () => {
  it('requires explicit Create anyway before the canonical new-Ticket form submits', async () => {
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(
      <MemoryRouter>
        <ValidationCenter validation={validation()} />
        <form id="ticket-editor-form" onSubmit={onSubmit}>
          <button type="submit">Save Ticket</button>
        </form>
      </MemoryRouter>,
    );

    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(await screen.findByText('Exact external TT match')).toBeInTheDocument();
    expect(screen.getByText(/possible related or duplicate incident/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save Ticket' }));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Create anyway' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Reviewed · create allowed/i)).toBeInTheDocument();
  });
});
