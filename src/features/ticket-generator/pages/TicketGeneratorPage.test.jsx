import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '../../../app/providers/AppProviders.jsx';
import { TicketGeneratorPage } from './TicketGeneratorPage.jsx';

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

describe('Template Generator workflow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('smart-pastes an existing report into generator fields and Progress Timeline', async () => {
    renderGenerator();

    fireEvent.change(screen.getByRole('textbox', { name: 'Existing report' }), {
      target: {
        value: `*[MANDAU] LINK DOWN AT DWDM 100315_RASUNA <> 100399_CANGKUDU [TT : INC-20260822-00015684]*
Impact
1. ❌ [FLP_3rd_MANDAU][Open - Major] DOWN - IMPACTED-LINK
Occur Time = 22/08/2026 13:16
Dispacth Time = 22/08/2026 13:54
PIC =
Rootcause = Still Investigation
Cut Point = Still Investigation

Update Progress
13:55 We Already Open TT MDU-20260822-0000037367 & Coordinated with team
14:08 team prepare tools`,
      },
    });

    expect(screen.getByText('7 fields · 1 impacts · 2 progress updates')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fill generator' }));

    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue(
      '[MANDAU] LINK DOWN AT DWDM 100315_RASUNA <> 100399_CANGKUDU [TT : INC-20260822-00015684]',
    );
    expect(screen.getByLabelText('Occur Time')).toHaveValue('2026-08-22T13:16');
    expect(screen.getByLabelText('Dispatch Time')).toHaveValue('2026-08-22T13:54');
    expect(screen.getByRole('textbox', { name: 'PIC' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Rootcause' })).toHaveValue('Still Investigation');
    expect(screen.getByRole('textbox', { name: 'Cut Point' })).toHaveValue('Still Investigation');
    expect(screen.getByRole('textbox', { name: 'Impact 1' })).toHaveValue(
      '❌ [FLP_3rd_MANDAU][Open - Major] DOWN - IMPACTED-LINK',
    );

    await waitFor(() => {
      expect(
        screen.getByText('We Already Open TT MDU-20260822-0000037367 & Coordinated with team'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('team prepare tools')).toBeInTheDocument();
    expect(screen.getByLabelText('Generated NOC report')).toHaveTextContent(
      'INC-20260822-00015684',
    );
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

    expect(
      screen.getByText('Running', { selector: 'span[data-status="RUNNING"]' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolve Ticket' })).toBeInTheDocument();
  });

  it('adds progress to both timeline and canonical report preview', async () => {
    renderGenerator();

    const progressInput = screen.getByRole('textbox', { name: 'Progress update' });
    fireEvent.change(progressInput, {
      target: { value: 'team OTW ke lokasi CP, ETA 75 menit' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add update' }));

    await waitFor(() => expect(progressInput).toHaveValue(''));
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
