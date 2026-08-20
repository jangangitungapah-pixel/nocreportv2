import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '../../../app/providers/AppProviders.jsx';
import { routeObjects } from '../../../app/router.jsx';

function renderGenerator() {
  const router = createMemoryRouter(routeObjects, { initialEntries: ['/generator/new'] });
  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe('Template Generator workflow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps Impact List hidden until the user adds a populated impact', () => {
    renderGenerator();

    const preview = screen.getByLabelText('Generated NOC report');
    expect(preview).not.toHaveTextContent('Impact List :');

    fireEvent.change(screen.getByRole('textbox', { name: /Title/ }), {
      target: { value: '[MANDAU] LINK DOWN, [TT : INC-20260818-00015849]' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add impact' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Impact 1' }), {
      target: { value: 'SITE_MAJALENGKA' },
    });

    expect(preview).toHaveTextContent('Title : *[MANDAU] LINK DOWN, [TT : INC-20260818-00015849]*');
    expect(preview).toHaveTextContent('Impact List : SITE_MAJALENGKA');
    expect(screen.getByText('INC-20260818-00015849', { selector: 'strong' })).toBeInTheDocument();
  });

  it('blocks Running status until Title and Occur Time exist', () => {
    renderGenerator();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Running' }));

    expect(screen.getAllByText('Title is required.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Occur Time is required.').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /Title/ }), {
      target: { value: '[MANDAU] LINK DOWN' },
    });
    fireEvent.change(screen.getByLabelText('Occur Time'), {
      target: { value: '2026-08-18T14:20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark Running' }));

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolve Ticket' })).toBeInTheDocument();
  });

  it('adds progress to both timeline and canonical report preview', () => {
    renderGenerator();

    fireEvent.change(screen.getByRole('textbox', { name: 'Progress update' }), {
      target: { value: 'team OTW ke lokasi CP, ETA 75 menit' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add update' }));

    expect(screen.getByText('team OTW ke lokasi CP, ETA 75 menit')).toBeInTheDocument();
    expect(screen.getByLabelText('Generated NOC report')).toHaveTextContent(
      'team OTW ke lokasi CP, ETA 75 menit',
    );
  });

  it('rejects invalid manual coordinates before Save', () => {
    renderGenerator();

    fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), {
      target: { value: '91' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Longitude' }), {
      target: { value: '107.12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Latitude must be between -90 and 90.')).toBeInTheDocument();
    expect(screen.getByText(/outside a valid geographic range/)).toBeInTheDocument();
  });

  it('copies the exact live report string through the Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderGenerator();
    fireEvent.change(screen.getByRole('textbox', { name: /Title/ }), {
      target: { value: '[MANDAU] LINK DOWN' },
    });
    const previewText = screen.getByLabelText('Generated NOC report').textContent;

    fireEvent.click(screen.getByRole('button', { name: 'Copy Report' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(previewText);
    });
  });
});
