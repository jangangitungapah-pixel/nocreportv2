import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '../../../app/providers/AppProviders.jsx';
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

describe('GEN-F3 Impact Builder page integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockViewport();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('applies selected Impact proposals to the live form and keeps them manually editable', () => {
    renderGenerator();

    fireEvent.change(screen.getByLabelText('Paste impact / service / node list'), {
      target: { value: '1. SITE_A\n- SITE_B\nsite_a' },
    });

    expect(screen.getByText(/1 duplicate skipped/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply Impact (2)' }));

    const firstImpact = screen.getByRole('textbox', { name: 'Impact 1' });
    const secondImpact = screen.getByRole('textbox', { name: 'Impact 2' });
    expect(firstImpact).toHaveValue('SITE_A');
    expect(secondImpact).toHaveValue('SITE_B');

    fireEvent.change(firstImpact, { target: { value: 'SITE_A_OPERATOR_EDIT' } });

    expect(firstImpact).toHaveValue('SITE_A_OPERATOR_EDIT');
    expect(screen.getByLabelText('Generated NOC report')).toHaveTextContent(
      'Impact List : SITE_A_OPERATOR_EDIT, SITE_B',
    );
  });
});
