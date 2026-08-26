import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '../../../app/providers/AppProviders.jsx';
import { readDraftRecovery, writeDraftRecovery } from '../lib/draftRecovery.js';
import { TicketGeneratorPage } from './TicketGeneratorPage.jsx';

function renderNewTicket() {
  const router = createMemoryRouter(
    [{ path: '/generator/new', element: <TicketGeneratorPage /> }],
    { initialEntries: ['/generator/new'] },
  );

  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe('TicketGenerator local draft recovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('restores a new Ticket form, local Progress timeline, and composer draft without Firestore', async () => {
    writeDraftRecovery({
      formValues: {
        title: '[MANDAU] RECOVERED LINK DOWN [TT : INC-20260827-00000001]',
        impactList: [{ value: 'RECOVERED_SITE' }],
        occurAt: '2026-08-27T00:10',
        dispatchAt: '2026-08-27T00:20',
        pic: 'Recovered Team',
        rootcause: 'Recovered rootcause',
        cutPoint: 'Recovered cut point',
      },
      featureMetadata: {
        externalTtNumber: 'INC-20260827-00000001',
        templateProfileId: 'MANDAU_DEFAULT',
        incidentKey: 'INC-20260827-00000001',
        pathKey: 'SITE_A<>SITE_B',
        alarmContext: { alarmFamily: 'LINK_DOWN', pathEndpoints: ['SITE_A', 'SITE_B'] },
      },
      progressEntries: [
        {
          id: 'recovered-progress-1',
          occurredAt: new Date('2026-08-26T17:30:00.000Z'),
          text: 'Recovered timeline update',
          createdAt: new Date('2026-08-26T17:31:00.000Z'),
        },
      ],
      progressDraft: {
        occurredAt: '2026-08-27T00:40',
        text: 'Recovered unsubmitted Progress text',
      },
      dirtyAt: new Date('2026-08-26T17:45:00.000Z'),
    });

    renderNewTicket();

    expect(await screen.findByLabelText('Draft recovery')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue(
      '[MANDAU] RECOVERED LINK DOWN [TT : INC-20260827-00000001]',
    );
    expect(screen.getByRole('textbox', { name: 'PIC' })).toHaveValue('Recovered Team');
    expect(screen.getByRole('textbox', { name: 'Impact 1' })).toHaveValue('RECOVERED_SITE');
    expect(screen.getByRole('textbox', { name: 'Progress update' })).toHaveValue(
      'Recovered unsubmitted Progress text',
    );
    expect(screen.getByText('Recovered timeline update')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByLabelText('Draft recovery')).not.toBeInTheDocument();
    });
  });

  it('discards a recovery snapshot without applying it to the current form', async () => {
    writeDraftRecovery({
      formValues: { title: 'Draft that should be discarded' },
      dirtyAt: new Date(),
    });

    renderNewTicket();

    expect(await screen.findByLabelText('Draft recovery')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('');
    await waitFor(() => {
      expect(screen.queryByLabelText('Draft recovery')).not.toBeInTheDocument();
      expect(readDraftRecovery().state).toBe('missing');
    });
  });
});
