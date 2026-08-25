import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { TicketViewerPage } from './TicketViewerPage.jsx';

const testState = vi.hoisted(() => ({
  canEdit: true,
  pushToast: vi.fn(),
  loadTicketEditor: vi.fn(),
}));

vi.mock('../../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    can(capability) {
      return capability === 'ticket:edit' ? testState.canEdit : true;
    },
  }),
}));

vi.mock('../../../app/providers/ToastProvider.jsx', () => ({
  useToast: () => ({ pushToast: testState.pushToast }),
}));

vi.mock('../lib/persistenceService.js', () => ({
  loadTicketEditor: testState.loadTicketEditor,
}));

function createLoadedTicket() {
  return {
    ticket: {
      id: 'ticket-1',
      title: '[MANDAU] LINK DOWN',
      externalTtNumber: 'INC-20260818-00015849',
      status: 'RUNNING',
      revision: 7,
      occurAt: new Date('2026-08-18T07:20:00.000Z'),
      dispatchAt: new Date('2026-08-18T07:30:00.000Z'),
      pic: 'Agus',
      rootcause: 'Fiber cut',
      cutPoint: 'KM 24 Majalengka',
      impactList: [],
      hasCoordinates: true,
      coordinate: {
        latitude: -6.12345,
        longitude: 107.12345,
        source: 'manual',
        verified: true,
      },
    },
    progress: [
      {
        id: 'progress-1',
        occurredAt: new Date('2026-08-18T08:00:00.000Z'),
        text: 'Team OTW to Cut Point',
      },
    ],
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/tickets/ticket-1']}>
      <Routes>
        <Route path="/tickets/:ticketId" element={<TicketViewerPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TicketViewerPage safe review mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.canEdit = true;
    testState.loadTicketEditor.mockResolvedValue(createLoadedTicket());
  });

  afterEach(() => {
    cleanup();
  });

  it('renders persisted Ticket data without editor controls and exposes an explicit Edit Ticket action', async () => {
    renderPage();

    expect(await screen.findByText('[MANDAU] LINK DOWN')).toBeInTheDocument();
    expect(screen.getByText('Safe review mode')).toBeInTheDocument();
    expect(screen.getByText('Team OTW to Cut Point')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();

    const editLink = screen.getByRole('link', { name: 'Edit Ticket' });
    expect(editLink).toHaveAttribute('href', '/generator/ticket-1/edit');
  });

  it('does not expose Edit Ticket when the current role cannot edit Tickets', async () => {
    testState.canEdit = false;
    renderPage();

    expect(await screen.findByText('[MANDAU] LINK DOWN')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit Ticket' })).not.toBeInTheDocument();
    expect(screen.getByText(/your role does not expose editing controls/i)).toBeInTheDocument();
  });
});
