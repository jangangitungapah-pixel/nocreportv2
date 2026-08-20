import { prepareOcrImage } from './imagePreprocessor.js';

function normalizeProgress(message) {
  const progress = Number(message?.progress ?? 0);
  return {
    status: String(message?.status ?? 'processing'),
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0,
  };
}

export async function recognizeImageText(file, { onProgress } = {}) {
  const { PSM, createWorker } = await import('tesseract.js');
  const image = await prepareOcrImage(file);
  const worker = await createWorker('eng', undefined, {
    logger: (message) => onProgress?.(normalizeProgress(message)),
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
    });

    const result = await worker.recognize(image);
    return {
      text: result.data?.text ?? '',
      confidence: Number(result.data?.confidence ?? 0),
    };
  } finally {
    await worker.terminate();
  }
}
