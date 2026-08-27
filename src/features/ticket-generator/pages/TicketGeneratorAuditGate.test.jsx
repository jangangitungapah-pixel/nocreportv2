import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { ToastProvider } from '../../../app/providers/ToastProvider.jsx';
import { createEmptyTicket } from '../../../entities/ticket/index.js';
import { TicketGeneratorPage } from './TicketGeneratorPage.jsx';

const authState = vi.hoisted(() => ({ canReadAudit: true }));
const persistenceMocks = vi.hoisted(() => ({
  loadTicketEditor: vi.fn(),
  loadTicketRevisionHistory: vi.fn(),
}));

vi.mock('../../../app/providers/AuthProvider.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useAuth: () => ({
    localDevelopmentMode: false,
    can: (capability) => capability === 'audit:read' && authState.canReadAudit,
  }),
}));

vi.mock('../lib/persistenceService.js', async (importOriginal) => ({
  ...(await importOriginal()),
  loadTicketEditor: persistenceMocks.loadTicketEditor,
  loadTicketRevisionHistory: persistenceMocks.loadTicketRevisionHistory,
}));

function renderExistingTicket() {
  const router = createMemoryRouter(
    [{ path: '/generator/:ticketId/edit', element: <TicketGeneratorPage /> }],
    { initialEntries: ['/generator/ticket-1/edit'] },
  );
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

describe('TicketGenerator audit capability gate', () => {
  beforeEach(() => {
    window.localStorage.clear();
    authState.canReadAudit = true;
    persistenceMocks.loadTicketEditor.mockReset();
    persistenceMocks.loadTicketRevisionHistory.mockReset();
    persistenceMocks.loadTicketEditor.mockResolvedValue({
      ticket: createEmptyTicket({ id: 'ticket-1', title: '[MANDAU] LINK DOWN', revision: 4 }),
      progress: [],
      coordinateSignature: 'none',
    });
    persistenceMocks.loadTicketRevisionHistory.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('enables bounded audit history for READ_AUDIT users on an existing Ticket', async () => {
    renderExistingTicket();
    await waitFor(() => expect(persistenceMocks.loadTicketEditor).toHaveBeenCalledWith('ticket-1'));
    await waitFor(() =>
      expect(persistenceMocks.loadTicketRevisionHistory).toHaveBeenCalledWith('ticket-1', {
        limit: 50,
      }),
    );
    expect(screen.getByLabelText('Revision history')).toBeInTheDocument();
  });

  it('does not query or render audit history without READ_AUDIT', async () => {
    authState.canReadAudit = false;
    renderExistingTicket();
    await waitFor(() => expect(persistenceMocks.loadTicketEditor).toHaveBeenCalledWith('ticket-1'));
    expect(persistenceMocks.loadTicketRevisionHistory).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Revision history')).not.toBeInTheDocument();
  });
});
