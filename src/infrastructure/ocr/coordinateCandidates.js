import { parseCoordinateText } from '../../entities/ticket/index.js';

export function normalizeOcrText(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[“”″]/g, '"')
    .replace(/[‘’′]/g, "'")
    .replace(/º/g, '°')
    .trim();
}

export function analyzeCoordinateOcrText(text) {
  const normalizedText = normalizeOcrText(text);
  const result = parseCoordinateText(normalizedText);

  return {
    ...result,
    rawText: String(text ?? ''),
    normalizedText,
  };
}
