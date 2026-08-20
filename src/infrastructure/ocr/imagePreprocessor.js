const TARGET_MIN_WIDTH = 1600;
const TARGET_MAX_WIDTH = 2400;
const MAX_UPSCALE = 2;

function targetWidth(width) {
  if (width >= TARGET_MIN_WIDTH) {
    return Math.min(width, TARGET_MAX_WIDTH);
  }

  return Math.min(TARGET_MIN_WIDTH, Math.round(width * MAX_UPSCALE));
}

export async function prepareOcrImage(file) {
  if (typeof createImageBitmap !== 'function') {
    return file;
  }

  const bitmap = await createImageBitmap(file);

  try {
    const width = targetWidth(bitmap.width);
    const scale = width / bitmap.width;
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      return file;
    }

    context.filter = 'grayscale(1) contrast(1.3)';
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.92));
    return blob ?? file;
  } finally {
    bitmap.close?.();
  }
}
