import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '../../../app/providers/AppProviders.jsx';

vi.mock('../lib/ticketFeatureMetadata.js', () => ({
  createEditorFeatureMetadata: vi.fn(() => ({
    externalTtNumber: 'DWDM-INC-20260825-00015373',
    titleMode: 'GENERATED',
    templateProfileId: 'MANDAU_DEFAULT',
    incidentKey: 'INC-20260825-00015373',
    pathKey: 'NODE_A<>NODE_B<>NODE_C',
    alarmContext: {
      rawAlarm: 'Link Down',
      alarmFamily: 'LINK_DOWN',
      alarmSource: '',
      emsAlarmNo: '',
      siteId: '',
      siteName: '',
      severity: '',
      sourceStatus: '',
      dispatchTo: '',
      region: '',
      description: '',
      lastLinkFlapped: '',
      transportFamily: 'DWDM UJB',
      pathEndpoints: ['NODE_A', 'NODE_B', 'NODE_C'],
      externalTtReferences: ['DWDM-INC-20260825-00015373'],
    },
    importProvenance: null,
    incidentGroupId: null,
  })),
  featureMetadataFromImportCandidate: vi.fn(),
}));

import { TicketGeneratorPage } from './TicketGeneratorPage.jsx';

function mockViewport() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderGenerator() {
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

describe('Template Generator Smart Title state', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockViewport();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('regenerates from structured metadata and switches to manual override after title editing', () => {
    renderGenerator();

    expect(screen.getByText(/Smart Title/)).toHaveTextContent('Generated');
    const regenerate = screen.getByRole('button', { name: 'Regenerate' });
    expect(regenerate).toBeEnabled();

    fireEvent.click(regenerate);
    const title = screen.getByRole('textbox', { name: /Title/ });
    expect(title).toHaveValue(
      '[MANDAU] LINK DOWN AT DWDM UJB NODE_A <> NODE_B <> NODE_C [TT : DWDM-INC-20260825-00015373]',
    );
    expect(screen.getByText(/Smart Title/)).toHaveTextContent('Generated');

    fireEvent.change(title, {
      target: { value: '[MANDAU] MANUAL OPERATOR TITLE [TT : INC-20260826-00000054]' },
    });

    expect(screen.getByText(/Smart Title/)).toHaveTextContent('Manual override');
    expect(screen.getByText('INC-20260826-00000054', { selector: 'strong' })).toBeInTheDocument();
  });
});
