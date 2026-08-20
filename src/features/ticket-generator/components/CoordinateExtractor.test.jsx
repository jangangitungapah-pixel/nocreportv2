import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { recognizeImageText } from '../../../infrastructure/ocr/ocrClient.js';
import { CoordinateExtractor } from './CoordinateExtractor.jsx';

vi.mock('../../../infrastructure/ocr/ocrClient.js', () => ({
  recognizeImageText: vi.fn(),
}));

describe('CoordinateExtractor', () => {
  beforeEach(() => {
    recognizeImageText.mockReset();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:cut-point-preview'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('extracts a coordinate candidate and requires explicit Apply & verify', async () => {
    recognizeImageText.mockResolvedValue({
      text: 'Latitude: -6.12345\nLongitude: 107.12345',
      confidence: 93,
      sourceLabel: 'Bottom-right watermark',
    });
    const onApplyCoordinate = vi.fn();
    render(<CoordinateExtractor onApplyCoordinate={onApplyCoordinate} />);

    const file = new File(['image'], 'cut-point.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose Cut Point photo'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Scan coordinates' }));

    expect(
      await screen.findByText(/Coordinate candidate detected from Bottom-right watermark/),
    ).toBeInTheDocument();
    expect(onApplyCoordinate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Apply & verify/ }));

    expect(onApplyCoordinate).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: -6.12345,
        longitude: 107.12345,
        formatted: '-6.12345, 107.12345',
        source: 'ocr',
        detectedFormat: 'DD',
        verified: true,
      }),
    );
    expect(screen.getByText(/Coordinate applied to editable/)).toBeInTheDocument();
  });

  it('shows both candidates when coordinate order is ambiguous', async () => {
    recognizeImageText.mockResolvedValue({ text: '-6.12345 7.12345', confidence: 80 });
    render(<CoordinateExtractor onApplyCoordinate={vi.fn()} />);

    const file = new File(['image'], 'cut-point.webp', { type: 'image/webp' });
    fireEvent.change(screen.getByLabelText('Choose Cut Point photo'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Scan coordinates' }));

    expect(await screen.findByText(/Coordinate result requires verification/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Apply & verify/ })).toHaveLength(2);
  });

  it('surfaces unsupported file errors before OCR is started', () => {
    render(<CoordinateExtractor onApplyCoordinate={vi.fn()} />);

    const file = new File(['image'], 'cut-point.gif', { type: 'image/gif' });
    fireEvent.change(screen.getByLabelText('Choose Cut Point photo'), {
      target: { files: [file] },
    });

    expect(screen.getByText('Use a JPG, PNG, or WebP image.')).toBeInTheDocument();
    expect(recognizeImageText).not.toHaveBeenCalled();
  });

  it('reports a no-coordinate OCR result without blocking manual entry', async () => {
    recognizeImageText.mockResolvedValue({ text: 'Bandung 18 Aug 2026', confidence: 74 });
    render(<CoordinateExtractor onApplyCoordinate={vi.fn()} />);

    const file = new File(['image'], 'cut-point.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Choose Cut Point photo'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Scan coordinates' }));

    await waitFor(() => {
      expect(screen.getByText(/No supported coordinate pattern was detected/)).toBeInTheDocument();
    });
  });
});
