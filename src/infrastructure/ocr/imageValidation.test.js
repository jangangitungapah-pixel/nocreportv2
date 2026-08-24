import { describe, expect, it } from 'vitest';

import { OCR_IMAGE_MAX_BYTES, validateOcrImageFile } from './imageValidation.js';

describe('OCR image validation', () => {
  it('accepts supported browser image types', () => {
    const file = new File(['image'], 'cut-point.png', { type: 'image/png' });

    expect(validateOcrImageFile(file)).toEqual({ valid: true, code: null, message: null });
  });

  it('rejects unsupported file types', () => {
    const file = new File(['image'], 'cut-point.gif', { type: 'image/gif' });

    expect(validateOcrImageFile(file).code).toBe('UNSUPPORTED_TYPE');
  });

  it('rejects files over the practical client-side limit', () => {
    const file = {
      name: 'huge.jpg',
      type: 'image/jpeg',
      size: OCR_IMAGE_MAX_BYTES + 1,
    };

    expect(validateOcrImageFile(file).code).toBe('FILE_TOO_LARGE');
  });
});
