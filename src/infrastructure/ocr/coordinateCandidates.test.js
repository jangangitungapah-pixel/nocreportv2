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

  it('parses a field DMS watermark that uses decimal comma', () => {
    const result = analyzeCoordinateOcrText(`20 Agu 2026 21.07.33\n6°35'39,378"S 106°39'57,78"E\nKabupaten Bogor`);

    expect(result.status).toBe('success');
    expect(result.format).toBe('DMS');
    expect(result.latitude).toBeCloseTo(-6.594271666666667, 8);
    expect(result.longitude).toBeCloseTo(106.66605, 8);
  });

  it('parses a signed field DD watermark with decimal comma and hemispheres', () => {
    const result = analyzeCoordinateOcrText(
      `20 Agu 2026 21:13:55.704\n-6,7709S +107,6371E\nKecamatan Ciater\nKabupaten Subang`,
    );

    expect(result).toMatchObject({
      status: 'success',
      format: 'DD',
      latitude: -6.7709,
      longitude: 107.6371,
    });
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
