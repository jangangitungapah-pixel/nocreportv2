export const OCR_IMAGE_MAX_BYTES = 15 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateOcrImageFile(file) {
  if (!file) {
    return {
      valid: false,
      code: 'NO_FILE',
      message: 'Choose a Cut Point image first.',
    };
  }

  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      code: 'UNSUPPORTED_TYPE',
      message: 'Use a JPG, PNG, or WebP image.',
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      code: 'EMPTY_FILE',
      message: 'The selected image is empty.',
    };
  }

  if (file.size > OCR_IMAGE_MAX_BYTES) {
    return {
      valid: false,
      code: 'FILE_TOO_LARGE',
      message: 'Image size must be 15 MB or smaller.',
    };
  }

  return { valid: true, code: null, message: null };
}
