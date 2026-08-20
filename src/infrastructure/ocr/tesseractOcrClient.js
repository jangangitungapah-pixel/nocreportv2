import { analyzeCoordinateOcrText } from './coordinateCandidates.js';
import { prepareOcrVariants } from './imagePreprocessor.js';

const COORDINATE_WHITELIST = `0123456789.,+-°º'\"NSEWnsew: `;
const GENERAL_WHITELIST =
  `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,+-°º'\"/:()#@& _-`;

function normalizeProgress(message) {
  const progress = Number(message?.progress ?? 0);
  return {
    status: String(message?.status ?? 'processing'),
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0,
  };
}

function reportAttemptProgress(onProgress, message, attemptIndex, attemptCount, label) {
  const current = normalizeProgress(message);
  const attemptShare = 1 / Math.max(1, attemptCount);
  const overall = attemptIndex * attemptShare + current.progress * attemptShare;

  onProgress?.({
    status: `Tesseract · ${label} · ${current.status}`,
    progress: Math.max(0, Math.min(1, overall)),
  });
}

function attemptResult(variant, result) {
  const text = result.data?.text ?? '';
  return {
    engine: 'tesseract',
    id: variant.id,
    label: `Tesseract · ${variant.label}`,
    text,
    confidence: Number(result.data?.confidence ?? 0),
    analysis: analyzeCoordinateOcrText(text),
  };
}

function isCoordinateResult(analysis) {
  return ['success', 'ambiguous', 'invalid'].includes(analysis?.status);
}

export async function recognizeWithTesseract(file, { onProgress } = {}) {
  const { PSM, createWorker } = await import('tesseract.js');
  const variants = await prepareOcrVariants(file);
  let activeAttemptIndex = 0;
  let activeAttemptLabel = variants[0]?.label ?? 'OCR';

  const worker = await createWorker('eng', undefined, {
    logger: (message) =>
      reportAttemptProgress(
        onProgress,
        message,
        activeAttemptIndex,
        variants.length,
        activeAttemptLabel,
      ),
  });
  const attempts = [];

  try {
    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      const isFocused = variant.coordinateFocused;
      activeAttemptIndex = index;
      activeAttemptLabel = variant.label;

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: isFocused ? COORDINATE_WHITELIST : GENERAL_WHITELIST,
      });

      const result = await worker.recognize(variant.image);
      const attempt = attemptResult(variant, result);
      attempts.push(attempt);

      if (isFocused && isCoordinateResult(attempt.analysis)) {
        return {
          engine: 'tesseract',
          text: attempt.text,
          confidence: attempt.confidence,
          analysis: attempt.analysis,
          sourceRegion: variant.id,
          sourceLabel: attempt.label,
          attempts,
        };
      }
    }

    const bestAttempt =
      attempts.find((attempt) => isCoordinateResult(attempt.analysis)) ??
      attempts.at(-1) ?? {
        engine: 'tesseract',
        text: '',
        confidence: 0,
        analysis: analyzeCoordinateOcrText(''),
        id: 'none',
        label: 'Tesseract · no OCR attempt',
      };

    return {
      engine: 'tesseract',
      text: bestAttempt.text,
      confidence: bestAttempt.confidence,
      analysis: bestAttempt.analysis,
      sourceRegion: bestAttempt.id,
      sourceLabel: bestAttempt.label,
      attempts,
    };
  } finally {
    await worker.terminate();
  }
}
