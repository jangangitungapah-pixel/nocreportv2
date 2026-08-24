import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { formatTicketReport } from '../../../entities/ticket/index.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { RunningTicketsPage } from './RunningTicketsPage.jsx';

const pushToast = vi.fn();
const authState = vi.hoisted(() => ({ canCreate: true, canMutate: true }));

vi.mock('../../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    localDevelopmentMode: false,
    can(capability) {
      if (capability === 'ticket:create') return authState.canCreate;
      if (capability === 'ticket:edit') return authState.canMutate;
      return true;
    },
  }),
}));

vi.mock('../../../app/providers/ToastProvider.jsx', () => ({
  useToast: () => ({ pushToast }),
}));

vi.mock('../../../infrastructure/firebase/index.js', () => ({
  firestoreTicketRepository: {
    listRunningTickets: vi.fn(),
    getTicketById: vi.fn(),
    listProgress: vi.fn(),
    transitionTicketStatus: vi.fn(),
  },
}));

function createTicket(overrides = {}) {
  return {
    id: 'ticket-1',
    title: '[MANDAU] LINK DOWN',
    externalTtNumber: 'INC-20260818-00015849',
    status: 'RUNNING',
    revision: 4,
    occurAt: new Date('2026-08-18T07:20:00.000Z'),
    dispatchAt: new Date('2026-08-18T07:20:00.000Z'),
    updatedAt: new Date('2026-08-18T09:00:00.000Z'),
    pic: 'Agus',
    rootcause: 'forest fire impact',
    cutPoint: 'KM 24 from Majalengka',
    impactList: [],
    hasCoordinates: true,
    latestProgress: {
      text: 'team arrived at cut point',
      occurredAt: new Date('2026-08-18T09:00:00.000Z'),
    },
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <RunningTicketsPage />
    </MemoryRouter>,
  );
}

describe('RunningTicketsPage operational actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.canCreate = true;
    authState.canMutate = true;
    firestoreTicketRepository.listRunningTickets.mockResolvedValue([
      createTicket(),
      createTicket({
        id: 'ticket-2',
        title: '[BANDUNG] SECOND LINK',
        externalTtNumber: 'INC-20260818-00015850',
        hasCoordinates: false,
        updatedAt: new Date('2026-08-18T08:00:00.000Z'),
      }),
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('filters the bounded Running dataset by coordinate availability and search', async () => {
    renderPage();

    expect(await screen.findAllByText('[MANDAU] LINK DOWN')).toHaveLength(2);
    expect(screen.getAllByText('[BANDUNG] SECOND LINK')).toHaveLength(2);

    fireEvent.click(screen.getByRole('combobox', { name: 'Coordinate filter' }));
    fireEvent.click(screen.getByRole('option', { name: 'With coordinates' }));
    expect(screen.queryAllByText('[BANDUNG] SECOND LINK')).toHaveLength(0);

    fireEvent.change(screen.getByRole('textbox', { name: /Search Running Tickets/ }), {
      target: { value: 'no-match' },
    });
    expect(screen.getByText('No tickets match your filters')).toBeInTheDocument();
  });

  it('exposes Add Progress as a direct deep link to the persisted Ticket composer', async () => {
    renderPage();
    await screen.findAllByText('[MANDAU] LINK DOWN');

    const links = screen.getAllByRole('link', { name: 'Add Progress' });
    expect(links[0]).toHaveAttribute('href', '/generator/ticket-1#progress-text');
  });

  it('keeps Viewer actions read-only while preserving Open and Copy Report', async () => {
    authState.canCreate = false;
    authState.canMutate = false;

    renderPage();
    await screen.findAllByText('[MANDAU] LINK DOWN');

    expect(screen.queryByRole('link', { name: 'New Ticket' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Add Progress' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Resolve INC-/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Copy report for INC-/ }).length).toBeGreaterThan(
      0,
    );
  });

  it('copies the canonical report from a fresh Ticket plus persisted Progress pages', async () => {
    const ticket = createTicket();
    const progress = [
      {
        id: 'progress-1',
        occurredAt: new Date('2026-08-18T08:00:00.000Z'),
        createdAt: new Date('2026-08-18T08:00:01.000Z'),
        text: 'team OTW to cut point',
      },
    ];
    firestoreTicketRepository.getTicketById.mockResolvedValue(ticket);
    firestoreTicketRepository.listProgress.mockResolvedValue({
      items: progress,
      hasMore: false,
      nextCursor: null,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderPage();
    await screen.findAllByText('[MANDAU] LINK DOWN');
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Copy report for INC-20260818-00015849' })[0],
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(formatTicketReport({ ...ticket, progress }));
    });
    expect(firestoreTicketRepository.listProgress).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: 'ticket-1', direction: 'asc' }),
    );
  });

  it('resolves a Running Ticket with optimistic revision and removes it from the queue', async () => {
    firestoreTicketRepository.transitionTicketStatus.mockResolvedValue({
      revision: 5,
      ticket: createTicket({ status: 'RESOLVED', revision: 5 }),
    });

    renderPage();
    await screen.findAllByText('[MANDAU] LINK DOWN');
    fireEvent.click(screen.getAllByRole('button', { name: 'Resolve INC-20260818-00015849' })[0]);

    await waitFor(() => {
      expect(firestoreTicketRepository.transitionTicketStatus).toHaveBeenCalledWith({
        ticketId: 'ticket-1',
        expectedRevision: 4,
        toStatus: 'RESOLVED',
      });
    });
    await waitFor(() => {
      expect(screen.queryAllByText('[MANDAU] LINK DOWN')).toHaveLength(0);
    });
  });
});
