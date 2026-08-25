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
  pic: 'Resolved PIC',
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

function firstButton(name) {
  return screen.getAllByRole('button', { name })[0];
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

  it('loads a bounded Resolved workspace with canonical read-only review navigation', async () => {
    renderPage();

    expect(await screen.findAllByText(resolvedTicket.title)).not.toHaveLength(0);
    expect(mocks.listTickets).toHaveBeenCalledWith({
      statuses: [TICKET_STATUS.RESOLVED],
      limit: 25,
    });
    expect(screen.getByRole('tab', { name: 'Resolved' })).toHaveAttribute('data-state', 'active');

    const reviewLinks = screen.getAllByRole('link', { name: resolvedTicket.title });
    expect(reviewLinks).not.toHaveLength(0);
    for (const link of reviewLinks) {
      expect(link).toHaveAttribute('href', `/tickets/${resolvedTicket.id}`);
    }
    expect(screen.queryByRole('link', { name: 'Open' })).not.toBeInTheDocument();
  });

  it('archives with the current revision through the controlled confirmation dialog', async () => {
    renderPage();
    await screen.findAllByText(resolvedTicket.title);

    fireEvent.click(firstButton(`Archive ${resolvedTicket.externalTtNumber}`));
    expect(screen.getByRole('dialog', { name: 'Archive Ticket?' })).toBeInTheDocument();
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

  it('uses Radix Tabs to load Archived Tickets and restores them to Resolved', async () => {
    mocks.listTickets
      .mockResolvedValueOnce({ items: [resolvedTicket], nextCursor: null, hasMore: false })
      .mockResolvedValueOnce({ items: [archivedTicket], nextCursor: null, hasMore: false });

    renderPage();
    await screen.findAllByText(resolvedTicket.title);
    fireEvent.click(screen.getByRole('tab', { name: 'Archived' }));

    await screen.findAllByText(archivedTicket.title);
    expect(screen.getByRole('tab', { name: 'Archived' })).toHaveAttribute('data-state', 'active');
    expect(mocks.listTickets).toHaveBeenLastCalledWith({
      statuses: [TICKET_STATUS.ARCHIVED],
      limit: 25,
    });

    fireEvent.click(firstButton(`Restore ${archivedTicket.externalTtNumber}`));
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

  it('continues the bounded 25-ticket query with the repository cursor', async () => {
    const nextResolved = {
      ...resolvedTicket,
      id: 'ticket-resolved-2',
      externalTtNumber: 'INC-20260824-00000003',
      title: '[T7] SECOND RESOLVED LINK',
      revision: 3,
    };
    const cursor = { updatedAt: resolvedTicket.updatedAt, id: resolvedTicket.id };

    mocks.listTickets
      .mockResolvedValueOnce({ items: [resolvedTicket], nextCursor: cursor, hasMore: true })
      .mockResolvedValueOnce({ items: [nextResolved], nextCursor: null, hasMore: false });

    renderPage();
    await screen.findAllByText(resolvedTicket.title);
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    await screen.findAllByText(nextResolved.title);
    expect(mocks.listTickets).toHaveBeenLastCalledWith({
      statuses: [TICKET_STATUS.RESOLVED],
      limit: 25,
      cursor,
    });
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('does not query lifecycle data without Archive/Restore capability', () => {
    mocks.canArchiveRestore = false;
    renderPage();

    expect(screen.getByText('Admin access required')).toBeInTheDocument();
    expect(mocks.listTickets).not.toHaveBeenCalled();
  });
});
