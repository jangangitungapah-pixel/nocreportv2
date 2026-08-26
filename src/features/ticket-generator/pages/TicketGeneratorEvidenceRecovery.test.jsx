import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '../../../app/providers/AppProviders.jsx';
import { TicketGeneratorPage } from './TicketGeneratorPage.jsx';

const RECOVERY_KEY = 'nocreport-ticket-draft:new';

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

function imageFile() {
  return new File([new Uint8Array([1, 2, 3, 4])], 'field-evidence.jpg', {
    type: 'image/jpeg',
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

beforeEach(() => {
  window.localStorage.clear();
  mockViewport();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:generator-evidence-preview'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GEN-F8 Generator evidence recovery integration', () => {
  it('recovers evidence-only authoring as metadata-only and requires explicit re-attach', async () => {
    const firstRender = renderGenerator();

    expect(screen.getByRole('heading', { name: 'Evidence Workspace' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Add local evidence images'), {
      target: { files: [imageFile()] },
    });

    expect(await screen.findByText('field-evidence.jpg')).toBeInTheDocument();
    expect(screen.getByText('Local file ready')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Operator note'), {
      target: { value: 'Before jointing activity' },
    });

    await waitFor(
      () => {
        const raw = window.localStorage.getItem(RECOVERY_KEY);
        expect(raw).toBeTruthy();
        const payload = JSON.parse(raw);
        expect(payload.evidenceItems).toHaveLength(1);
        expect(payload.evidenceItems[0]).toMatchObject({
          name: 'field-evidence.jpg',
          type: 'image/jpeg',
          note: 'Before jointing activity',
          localFileAvailable: false,
        });
        expect(payload.evidenceItems[0]).not.toHaveProperty('file');
        expect(payload.evidenceItems[0]).not.toHaveProperty('previewUrl');
      },
      { timeout: 2500 },
    );

    firstRender.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:generator-evidence-preview');

    renderGenerator();
    expect(await screen.findByText('Local recovery draft found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    expect(await screen.findByText('Re-attach required')).toBeInTheDocument();
    expect(screen.getByText('field-evidence.jpg')).toBeInTheDocument();
    expect(screen.getByLabelText('Operator note')).toHaveValue('Before jointing activity');
    expect(screen.getByText(/Only safe metadata survived recovery/)).toBeInTheDocument();

    const evidenceWorkspace = screen
      .getByRole('heading', { name: 'Evidence Workspace' })
      .closest('section');
    expect(evidenceWorkspace).not.toBeNull();
    expect(within(evidenceWorkspace).getByRole('button', { name: 'Scan coordinates' })).toBeDisabled();
  });
});
