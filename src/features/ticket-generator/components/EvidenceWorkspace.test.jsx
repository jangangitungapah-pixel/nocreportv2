import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { restoreEvidenceRecoveryItems } from '../lib/evidenceWorkspace.js';
import { EvidenceWorkspace } from './EvidenceWorkspace.jsx';

const recognizeImageText = vi.fn();

vi.mock('../../../infrastructure/ocr/ocrClient.js', () => ({
  recognizeImageText: (...args) => recognizeImageText(...args),
}));

function imageFile({ name = 'evidence.jpg', type = 'image/jpeg' } = {}) {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type });
}

function Harness({ initialItems = [], onApplyCoordinate = vi.fn() }) {
  const [items, setItems] = useState(initialItems);
  return (
    <EvidenceWorkspace
      items={items}
      onItemsChange={setItems}
      onApplyCoordinate={onApplyCoordinate}
    />
  );
}

beforeEach(() => {
  recognizeImageText.mockReset();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:local-evidence-preview'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
});

describe('GEN-F8 EvidenceWorkspace', () => {
  it('adds a local image, edits its note, and revokes the preview when removed', async () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText('Add local evidence images'), {
      target: { files: [imageFile()] },
    });

    expect(await screen.findByText('evidence.jpg')).toBeInTheDocument();
    expect(screen.getByText('Local file ready')).toBeInTheDocument();
    expect(screen.getByAltText('Local evidence preview: evidence.jpg')).toBeInTheDocument();

    const note = screen.getByLabelText('Operator note');
    fireEvent.change(note, { target: { value: 'Before jointing activity' } });
    expect(note).toHaveValue('Before jointing activity');

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByText('evidence.jpg')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-evidence-preview'),
    );
  });

  it('renders recovered metadata honestly and requires explicit re-attach before OCR', () => {
    const recovered = restoreEvidenceRecoveryItems([
      {
        id: 'recovered-1',
        name: 'old.png',
        size: 1200,
        type: 'image/png',
        note: 'Recovered local metadata',
      },
    ]);
    render(<Harness initialItems={recovered} />);

    expect(screen.getByText('Re-attach required')).toBeInTheDocument();
    expect(screen.getByText(/Only safe metadata survived recovery/)).toBeInTheDocument();
    expect(screen.getByLabelText('Operator note')).toHaveValue('Recovered local metadata');
    expect(screen.getByRole('button', { name: 'Scan coordinates' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Re-attach evidence old.png'), {
      target: { files: [imageFile({ name: 'reattached.png', type: 'image/png' })] },
    });

    expect(screen.getByText('reattached.png')).toBeInTheDocument();
    expect(screen.getByText('Local file ready')).toBeInTheDocument();
    expect(screen.getByLabelText('Operator note')).toHaveValue('Recovered local metadata');
    expect(screen.getByRole('button', { name: 'Scan coordinates' })).toBeEnabled();
  });

  it('reuses local OCR, requires candidate review, and only then applies Ticket coordinates', async () => {
    const onApplyCoordinate = vi.fn();
    recognizeImageText.mockImplementation(async (_file, { onProgress }) => {
      onProgress?.({ status: 'Local OCR', progress: 0.5 });
      return {
        sourceLabel: 'PaddleOCR',
        confidence: 92,
        analysis: {
          status: 'success',
          latitude: -6.12345,
          longitude: 107.54321,
          formatted: '-6.12345, 107.54321',
          format: 'decimal_pair',
        },
      };
    });

    render(<Harness onApplyCoordinate={onApplyCoordinate} />);
    fireEvent.change(screen.getByLabelText('Add local evidence images'), {
      target: { files: [imageFile()] },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Scan coordinates' }));

    expect(await screen.findByText('-6.12345, 107.54321')).toBeInTheDocument();
    expect(onApplyCoordinate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Apply coordinate/ }));
    expect(onApplyCoordinate).toHaveBeenCalledTimes(1);
    expect(onApplyCoordinate.mock.calls[0][0]).toMatchObject({
      latitude: -6.12345,
      longitude: 107.54321,
      detectedFormat: 'decimal_pair',
      confidence: 92,
      source: 'ocr',
      verified: true,
    });
    expect(screen.getByText(/Selected coordinate/)).toHaveTextContent('-6.12345, 107.54321');
  });
});
