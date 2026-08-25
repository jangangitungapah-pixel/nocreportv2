import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { createLeafletMap } from '../../../infrastructure/map/index.js';
import { CutPointTrackerPage } from './CutPointTrackerPage.jsx';

vi.mock('../../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({ localDevelopmentMode: false }),
}));

vi.mock('../../../infrastructure/firebase/index.js', () => ({
  firestoreTicketRepository: {
    listCutPointTickets: vi.fn(),
  },
}));

vi.mock('../../../infrastructure/map/index.js', () => ({
  readMapConfig: () => ({
    tileUrl: 'https://tiles.example/{z}/{x}/{y}.png',
    attribution: 'Example tiles',
  }),
  createLeafletMap: vi.fn(),
}));

const mapClient = {
  setMarkers: vi.fn(),
  focusMarker: vi.fn(),
  invalidateSize: vi.fn(),
  destroy: vi.fn(),
};

function ticket(overrides = {}) {
  return {
    id: 'ticket-1',
    title: '[MANDAU] LINK DOWN',
    externalTtNumber: 'INC-20260818-00015849',
    status: 'RUNNING',
    pic: 'Agus',
    cutPoint: 'KM 24 Majalengka',
    hasCoordinates: true,
    coordinate: { latitude: -6.12345, longitude: 107.12345, verified: true },
    latestProgress: { text: 'team arrived' },
    updatedAt: new Date('2026-08-18T09:00:00.000Z'),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CutPointTrackerPage />
    </MemoryRouter>,
  );
}

describe('CutPointTrackerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createLeafletMap.mockResolvedValue(mapClient);
    firestoreTicketRepository.listCutPointTickets.mockResolvedValue([
      ticket(),
      ticket({
        id: 'ticket-2',
        title: '[BANDUNG] RESOLVED LINK',
        externalTtNumber: 'INC-20260818-00015850',
        status: 'RESOLVED',
        coordinate: { latitude: -6.9, longitude: 107.6, verified: true },
      }),
      ticket({
        id: 'invalid-ticket',
        coordinate: { latitude: 99, longitude: 107, verified: true },
      }),
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it('loads a bounded canonical Ticket query and sends valid markers to Leaflet', async () => {
    renderPage();

    expect(await screen.findByText('[MANDAU] LINK DOWN')).toBeInTheDocument();
    expect(firestoreTicketRepository.listCutPointTickets).toHaveBeenCalledWith({
      statuses: ['RUNNING', 'RESOLVED'],
      limit: 500,
    });

    await waitFor(() => {
      expect(mapClient.setMarkers).toHaveBeenCalledWith([
        expect.objectContaining({ ticketId: 'ticket-1' }),
        expect.objectContaining({ ticketId: 'ticket-2' }),
      ]);
    });
    expect(screen.queryByText('invalid-ticket')).not.toBeInTheDocument();
  });

  it('filters the marker list and map by status and search', async () => {
    renderPage();
    await screen.findByText('[MANDAU] LINK DOWN');

    fireEvent.click(screen.getByRole('combobox', { name: 'Ticket status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Resolved' }));
    expect(screen.queryByText('[MANDAU] LINK DOWN')).not.toBeInTheDocument();
    expect(screen.getByText('[BANDUNG] RESOLVED LINK')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search mapped Tickets' }), {
      target: { value: 'does-not-exist' },
    });
    expect(screen.getByText('No markers match')).toBeInTheDocument();

    await waitFor(() => {
      expect(mapClient.setMarkers).toHaveBeenLastCalledWith([]);
    });
  });

  it('focuses a marker from the responsive Ticket list and keeps review read-only', async () => {
    renderPage();
    await screen.findByText('[MANDAU] LINK DOWN');

    fireEvent.click(screen.getAllByRole('button', { name: 'Locate' })[0]);
    expect(mapClient.focusMarker).toHaveBeenCalledWith('ticket-1');
    expect(screen.getAllByRole('link', { name: 'Open Ticket' })[0]).toHaveAttribute(
      'href',
      '/tickets/ticket-1',
    );

    const mapOptions = createLeafletMap.mock.calls[0][0];
    expect(mapOptions.onOpenTicket).toEqual(expect.any(Function));
  });
});
