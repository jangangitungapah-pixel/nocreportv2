import { analyzeCoordinateOcrText } from './coordinateCandidates.js';
import { prepareOcrVariants } from './imagePreprocessor.js';

let paddlePromise = null;

function coordinateStatusRank(status) {
  if (status === 'success') return 3;
  if (status === 'ambiguous') return 2;
  if (status === 'invalid') return 1;
  return 0;
}

function itemPosition(item) {
  const points = Array.isArray(item?.poly) ? item.poly : [];
  const xs = points.map((point) => Number(point?.[0] ?? point?.x ?? 0));
  const ys = points.map((point) => Number(point?.[1] ?? point?.y ?? 0));
  return {
    x: xs.length ? Math.min(...xs) : 0,
    y: ys.length ? Math.min(...ys) : 0,
  };
}

function resultText(result) {
  const items = Array.isArray(result?.items) ? [...result.items] : [];
  items.sort((a, b) => {
    const pa = itemPosition(a);
    const pb = itemPosition(b);
    if (Math.abs(pa.y - pb.y) > 24) return pa.y - pb.y;
    return pa.x - pb.x;
  });
  return items.map((item) => String(item?.text ?? '').trim()).filter(Boolean).join('\n');
}

function resultConfidence(result) {
  const scores = (Array.isArray(result?.items) ? result.items : [])
    .map((item) => Number(item?.score))
    .filter(Number.isFinite);
  if (!scores.length) return 0;
  return (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100;
}

async function getPaddleOcr() {
  if (!paddlePromise) {
    paddlePromise = import('@paddleocr/paddleocr-js').then(async ({ PaddleOCR }) =>
      PaddleOCR.create({
        textDetectionModelName: 'PP-OCRv5_mobile_det',
        textRecognitionModelName: 'PP-OCRv5_mobile_rec',
        ortOptions: {
          backend: 'wasm',
          numThreads: 1,
          simd: true,
        },
      }),
    );
  }
  return paddlePromise;
}

function buildAttempt(variant, result) {
  const text = resultText(result);
  const confidence = resultConfidence(result);
  return {
    engine: 'paddleocr',
    id: variant.id,
    label: `PaddleOCR · ${variant.label}`,
    text,
    confidence,
    analysis: analyzeCoordinateOcrText(text),
    detectedBoxes: Number(result?.metrics?.detectedBoxes ?? 0),
    recognizedCount: Number(result?.metrics?.recognizedCount ?? 0),
  };
}

export async function recognizeWithPaddle(file, { onProgress } = {}) {
  onProgress?.({ status: 'PaddleOCR · loading detection models', progress: 0.05 });
  const ocr = await getPaddleOcr();
  onProgress?.({ status: 'PaddleOCR · preparing watermark regions', progress: 0.18 });

  const prepared = await prepareOcrVariants(file);
  const focused = prepared.filter((variant) => variant.coordinateFocused);
  const variants = [
    ...focused,
    { id: 'original', label: 'Original full image', image: file, coordinateFocused: false },
  ];

  onProgress?.({ status: 'PaddleOCR · detecting text boxes', progress: 0.28 });
  const results = await ocr.predict(
    variants.map((variant) => variant.image),
    {
      textDetLimitSideLen: 1600,
      textDetLimitType: 'max',
      textDetThresh: 0.18,
      textDetBoxThresh: 0.28,
      textDetUnclipRatio: 1.8,
      textRecScoreThresh: 0.12,
    },
  );

  const attempts = variants.map((variant, index) => buildAttempt(variant, results[index]));
  attempts.sort((a, b) => {
    const statusDiff = coordinateStatusRank(b.analysis?.status) - coordinateStatusRank(a.analysis?.status);
    if (statusDiff !== 0) return statusDiff;
    return b.confidence - a.confidence;
  });

  const best = attempts[0] ?? {
    engine: 'paddleocr',
    id: 'none',
    label: 'PaddleOCR · no OCR attempt',
    text: '',
    confidence: 0,
    analysis: analyzeCoordinateOcrText(''),
  };

  onProgress?.({
    status:
      coordinateStatusRank(best.analysis?.status) > 0
        ? 'PaddleOCR · coordinate candidate detected'
        : 'PaddleOCR · no coordinate candidate',
    progress: 0.68,
  });

  return {
    engine: 'paddleocr',
    text: best.text,
    confidence: best.confidence,
    analysis: best.analysis,
    sourceRegion: best.id,
    sourceLabel: best.label,
    attempts,
  };
}
