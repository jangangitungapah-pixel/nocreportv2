import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { DashboardPage } from './DashboardPage.jsx';

const testState = vi.hoisted(() => ({
  getDashboardSummary: vi.fn(),
}));

vi.mock('../../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    localDevelopmentMode: false,
    can: () => true,
  }),
}));

vi.mock('../../../infrastructure/firebase/index.js', () => ({
  firestoreTicketRepository: {
    getDashboardSummary: testState.getDashboardSummary,
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage review navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.getDashboardSummary.mockResolvedValue({
      runningCount: 1,
      ticketsTodayCount: 1,
      resolvedTodayCount: 0,
      cutPointCount: 1,
      recentlyUpdated: [
        {
          id: 'ticket-1',
          title: '[MANDAU] LINK DOWN',
          externalTtNumber: 'INC-20260818-00015849',
          status: 'RUNNING',
          updatedAt: new Date('2026-08-18T09:00:00.000Z'),
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('opens a recent Ticket in the read-only detail route instead of Template Generator', async () => {
    renderPage();

    const ticketLink = await screen.findByRole('link', { name: /INC-20260818-00015849/ });
    expect(ticketLink).toHaveAttribute('href', '/tickets/ticket-1');
  });
});
