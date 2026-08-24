import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { TICKET_STATUS } from '../../../entities/ticket/index.js';
import { ArchiveManagementPage } from './ArchiveManagementPage.jsx';

const mocks = vi.hoisted(() => ({
  canArchiveRestore: true,
  listTickets: vi.fn(),
  archiveTicket: vi.fn(),
  restoreTicket: vi.fn(),
  pushToast: vi.fn(),
}));

vi.mock('../../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    can: () => mocks.canArchiveRestore,
    localDevelopmentMode: false,
  }),
}));

vi.mock('../../../app/providers/ToastProvider.jsx', () => ({
  useToast: () => ({ pushToast: mocks.pushToast }),
}));

vi.mock('../../../infrastructure/firebase/index.js', () => ({
  firestoreTicketRepository: {
    listTickets: mocks.listTickets,
    archiveTicket: mocks.archiveTicket,
    restoreTicket: mocks.restoreTicket,
  },
}));

const resolvedTicket = {
  id: 'ticket-resolved',
  title: '[T7] RESOLVED LINK DOWN',
  externalTtNumber: 'INC-20260824-00000001',
  status: TICKET_STATUS.RESOLVED,
  updatedAt: new Date('2026-08-24T07:00:00.000Z'),
  revision: 7,
};

const archivedTicket = {
  ...resolvedTicket,
  id: 'ticket-archived',
  title: '[T7] ARCHIVED LINK DOWN',
  externalTtNumber: 'INC-20260824-00000002',
  status: TICKET_STATUS.ARCHIVED,
  revision: 9,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ArchiveManagementPage />
    </MemoryRouter>,
  );
}

describe('ArchiveManagementPage', () => {
  beforeEach(() => {
    mocks.canArchiveRestore = true;
    mocks.listTickets.mockReset();
    mocks.archiveTicket.mockReset();
    mocks.restoreTicket.mockReset();
    mocks.pushToast.mockReset();
    mocks.listTickets.mockResolvedValue({
      items: [resolvedTicket],
      nextCursor: null,
      hasMore: false,
    });
    mocks.archiveTicket.mockResolvedValue({ ticket: { ...resolvedTicket, status: 'ARCHIVED' } });
    mocks.restoreTicket.mockResolvedValue({ ticket: { ...archivedTicket, status: 'RESOLVED' } });
  });

  afterEach(() => {
    cleanup();
  });

  it('loads a bounded Resolved page and archives with the current revision', async () => {
    renderPage();

    await expect(screen.findByText(resolvedTicket.title)).resolves.toBeInTheDocument();
    expect(mocks.listTickets).toHaveBeenCalledWith({
      statuses: [TICKET_STATUS.RESOLVED],
      limit: 25,
    });

    fireEvent.click(
      screen.getByRole('button', { name: `Archive ${resolvedTicket.externalTtNumber}` }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Archive Ticket' }));

    await waitFor(() => {
      expect(mocks.archiveTicket).toHaveBeenCalledWith({
        ticketId: resolvedTicket.id,
        expectedRevision: resolvedTicket.revision,
      });
    });
    expect(screen.queryByText(resolvedTicket.title)).not.toBeInTheDocument();
    expect(mocks.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Ticket archived', tone: 'success' }),
    );
  });

  it('loads Archived Tickets on demand and restores them to Resolved', async () => {
    mocks.listTickets
      .mockResolvedValueOnce({ items: [resolvedTicket], nextCursor: null, hasMore: false })
      .mockResolvedValueOnce({ items: [archivedTicket], nextCursor: null, hasMore: false });

    renderPage();
    await screen.findByText(resolvedTicket.title);
    fireEvent.click(screen.getByRole('button', { name: 'Archived' }));

    await screen.findByText(archivedTicket.title);
    expect(mocks.listTickets).toHaveBeenLastCalledWith({
      statuses: [TICKET_STATUS.ARCHIVED],
      limit: 25,
    });

    fireEvent.click(
      screen.getByRole('button', { name: `Restore ${archivedTicket.externalTtNumber}` }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore Ticket' }));

    await waitFor(() => {
      expect(mocks.restoreTicket).toHaveBeenCalledWith({
        ticketId: archivedTicket.id,
        expectedRevision: archivedTicket.revision,
        toStatus: TICKET_STATUS.RESOLVED,
      });
    });
    expect(mocks.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Ticket restored', tone: 'success' }),
    );
  });

  it('does not query lifecycle data without Archive/Restore capability', () => {
    mocks.canArchiveRestore = false;
    renderPage();

    expect(screen.getByText('Admin access required')).toBeInTheDocument();
    expect(mocks.listTickets).not.toHaveBeenCalled();
  });
});
