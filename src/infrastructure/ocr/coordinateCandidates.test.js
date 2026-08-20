import { describe, expect, it } from 'vitest';

import { analyzeCoordinateOcrText, normalizeOcrText } from './coordinateCandidates.js';

describe('OCR coordinate candidate pipeline', () => {
  it('parses labeled Decimal Degrees', () => {
    const result = analyzeCoordinateOcrText('Latitude: -6.12345\nLongitude: 107.12345');

    expect(result).toMatchObject({
      status: 'success',
      format: 'DD',
      latitude: -6.12345,
      longitude: 107.12345,
      formatted: '-6.12345, 107.12345',
    });
  });

  it('parses DMS watermark text', () => {
    const result = analyzeCoordinateOcrText(`6° 07' 24.42" S\n107° 07' 24.42" E`);

    expect(result.status).toBe('success');
    expect(result.format).toBe('DMS');
    expect(result.formatted).toBe('-6.12345, 107.12345');
  });

  it('parses DDM watermark text', () => {
    const result = analyzeCoordinateOcrText(`6° 07.407' S\n107° 07.407' E`);

    expect(result.status).toBe('success');
    expect(result.format).toBe('DDM');
    expect(result.formatted).toBe('-6.12345, 107.12345');
  });

  it('requires verification when an unlabeled space-separated pair can be swapped', () => {
    const result = analyzeCoordinateOcrText('-6.12345 107.12345');

    expect(result.status).toBe('ambiguous');
    expect(result.code).toBe('AMBIGUOUS_ORDER');
    expect(result.candidates).toHaveLength(2);
  });

  it('fails gracefully when no coordinate exists', () => {
    const result = analyzeCoordinateOcrText('Camera watermark · Bandung · 18 Aug 2026');

    expect(result).toMatchObject({ status: 'not_found', code: 'NO_COORDINATE' });
  });

  it('normalizes typography without guessing numeric OCR errors', () => {
    expect(normalizeOcrText('6º 07’ 24.42” S')).toBe(`6° 07' 24.42" S`);
  });
});
