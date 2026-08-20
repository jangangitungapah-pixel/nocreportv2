const TARGET_REGION_WIDTH = 2200;
const TARGET_FULL_WIDTH = 1800;
const MAX_REGION_SCALE = 4;
const MAX_FULL_SCALE = 2;

function scaledDimensions(width, height, targetWidth, maxScale) {
  const scale = Math.min(maxScale, Math.max(1, targetWidth / width));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
}

async function renderRegion(bitmap, region, { targetWidth, maxScale, contrast = 1.65 } = {}) {
  const sourceX = Math.max(0, Math.round(bitmap.width * region.x));
  const sourceY = Math.max(0, Math.round(bitmap.height * region.y));
  const sourceWidth = Math.max(1, Math.round(bitmap.width * region.width));
  const sourceHeight = Math.max(1, Math.round(bitmap.height * region.height));
  const dimensions = scaledDimensions(sourceWidth, sourceHeight, targetWidth, maxScale);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return null;

  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.filter = `grayscale(1) contrast(${contrast})`;
  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    dimensions.width,
    dimensions.height,
  );

  return canvasBlob(canvas);
}

const OCR_REGIONS = Object.freeze([
  {
    id: 'bottom-right',
    label: 'Bottom-right watermark',
    region: { x: 0.35, y: 0.52, width: 0.65, height: 0.48 },
    targetWidth: TARGET_REGION_WIDTH,
    maxScale: MAX_REGION_SCALE,
    contrast: 1.8,
  },
  {
    id: 'lower-band',
    label: 'Lower watermark band',
    region: { x: 0, y: 0.52, width: 1, height: 0.48 },
    targetWidth: TARGET_REGION_WIDTH,
    maxScale: 3,
    contrast: 1.7,
  },
  {
    id: 'bottom-left',
    label: 'Bottom-left watermark',
    region: { x: 0, y: 0.55, width: 0.6, height: 0.45 },
    targetWidth: TARGET_REGION_WIDTH,
    maxScale: MAX_REGION_SCALE,
    contrast: 1.8,
  },
]);

export async function prepareOcrVariants(file) {
  if (typeof createImageBitmap !== 'function') {
    return [{ id: 'original', label: 'Original image', image: file, coordinateFocused: false }];
  }

  const bitmap = await createImageBitmap(file);

  try {
    const variants = [];

    for (const config of OCR_REGIONS) {
      const image = await renderRegion(bitmap, config.region, config);
      if (image) {
        variants.push({
          id: config.id,
          label: config.label,
          image,
          coordinateFocused: true,
        });
      }
    }

    const fullImage = await renderRegion(
      bitmap,
      { x: 0, y: 0, width: 1, height: 1 },
      {
        targetWidth: TARGET_FULL_WIDTH,
        maxScale: MAX_FULL_SCALE,
        contrast: 1.35,
      },
    );

    variants.push({
      id: 'full',
      label: 'Full image fallback',
      image: fullImage ?? file,
      coordinateFocused: false,
    });

    return variants;
  } finally {
    bitmap.close?.();
  }
}

export async function prepareOcrImage(file) {
  const variants = await prepareOcrVariants(file);
  return variants.at(-1)?.image ?? file;
}
