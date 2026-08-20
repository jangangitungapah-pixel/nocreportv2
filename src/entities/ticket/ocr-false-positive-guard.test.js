import { describe, expect, it } from 'vitest';

import { parseCoordinateText } from './index.js';

describe('OCR coordinate false-positive guard', () => {
  it('does not interpret short OCR number pairs as coordinates', () => {
    expect(parseCoordinateText('random OCR noise 8,7 other text')).toEqual({
      status: 'not_found',
      format: null,
      code: 'NO_COORDINATE',
    });
  });

  it('still accepts precise unlabeled decimal coordinate pairs', () => {
    expect(parseCoordinateText('-6.594272, 106.666050')).toMatchObject({
      status: 'success',
      format: 'DD',
      latitude: -6.594272,
      longitude: 106.66605,
    });
  });
});
