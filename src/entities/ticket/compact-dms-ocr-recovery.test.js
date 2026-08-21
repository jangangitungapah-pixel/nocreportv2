import { describe, expect, it } from 'vitest';

import { parseCoordinateText } from './index.js';

describe('compact DMS OCR recovery', () => {
  it('recovers a watermark when OCR drops degree/minute/second symbols', () => {
    const result = parseCoordinateText('63539.378S 1063957.78E');

    expect(result).toMatchObject({
      status: 'ambiguous',
      format: 'DMS',
      code: 'OCR_COMPACT_DMS_RECOVERY',
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].latitude).toBeCloseTo(-6.5942716667, 8);
    expect(result.candidates[0].longitude).toBeCloseTo(106.66605, 8);
  });

  it('does not reinterpret normal decimal hemisphere coordinates as compact DMS', () => {
    const result = parseCoordinateText('7.14880862S 110.42380314E');

    expect(result).toMatchObject({
      status: 'success',
      format: 'DD',
      latitude: -7.14880862,
      longitude: 110.42380314,
    });
  });
});
