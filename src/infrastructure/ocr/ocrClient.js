import { recognizeWithPaddle } from './paddleOcrClient.js';
import { recognizeWithTesseract } from './tesseractOcrClient.js';

function hasCoordinateCandidate(result) {
  return ['success', 'ambiguous', 'invalid'].includes(result?.analysis?.status);
}

function combineAttempts(primary, fallback) {
  return [...(primary?.attempts ?? []), ...(fallback?.attempts ?? [])];
}

export async function recognizeImageText(file, { onProgress } = {}) {
  let paddleResult = null;
  let paddleError = null;

  try {
    paddleResult = await recognizeWithPaddle(file, {
      onProgress: (progress) =>
        onProgress?.({
          status: progress.status,
          progress: Math.min(0.7, Number(progress.progress ?? 0) * 0.7),
        }),
    });

    if (hasCoordinateCandidate(paddleResult)) {
      onProgress?.({ status: 'PaddleOCR coordinate candidate ready', progress: 1 });
      return paddleResult;
    }
  } catch (error) {
    paddleError = error;
  }

  onProgress?.({
    status: paddleError
      ? 'PaddleOCR unavailable · trying Tesseract fallback'
      : 'Trying Tesseract fallback',
    progress: 0.72,
  });

  const tesseractResult = await recognizeWithTesseract(file, {
    onProgress: (progress) =>
      onProgress?.({
        status: progress.status,
        progress: 0.72 + Math.min(0.28, Number(progress.progress ?? 0) * 0.28),
      }),
  });

  if (hasCoordinateCandidate(tesseractResult)) {
    return {
      ...tesseractResult,
      attempts: combineAttempts(paddleResult, tesseractResult),
      fallbackReason: paddleError?.message ?? null,
    };
  }

  const reviewResult =
    paddleResult && Number(paddleResult.confidence ?? 0) >= Number(tesseractResult.confidence ?? 0)
      ? paddleResult
      : tesseractResult;

  return {
    ...reviewResult,
    attempts: combineAttempts(paddleResult, tesseractResult),
    fallbackReason: paddleError?.message ?? null,
  };
}
