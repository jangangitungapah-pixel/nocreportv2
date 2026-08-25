import { cleanup, render, screen, within } from '@testing-library/react';
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
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage dense operations workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.getDashboardSummary.mockResolvedValue({
      runningCount: 1,
      ticketsTodayCount: 3,
      resolvedTodayCount: 2,
      cutPointCount: 4,
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

  it('renders the compact metric strip and dense recent activity dataset', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Operational overview' }),
    ).toBeInTheDocument();
    const metricStrip = screen.getByRole('region', { name: "Today's operational pulse" });
    expect(within(metricStrip).getByText('Running')).toBeInTheDocument();
    expect(within(metricStrip).getByText('Today')).toBeInTheDocument();
    expect(within(metricStrip).getByText('Resolved')).toBeInTheDocument();
    expect(within(metricStrip).getByText('Cut Points')).toBeInTheDocument();
    expect(within(metricStrip).getByText('1')).toBeInTheDocument();
    expect(within(metricStrip).getByText('3')).toBeInTheDocument();
    expect(within(metricStrip).getByText('2')).toBeInTheDocument();
    expect(within(metricStrip).getByText('4')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Recently updated' })).toBeInTheDocument();
    expect(screen.getByText('Incident')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('opens a recent Ticket in the read-only detail route instead of Template Generator', async () => {
    renderPage();

    const ticketLink = await screen.findByRole('link', { name: /INC-20260818-00015849/ });
    expect(ticketLink).toHaveAttribute('href', '/tickets/ticket-1');
  });
});
