import { getGeminiApiKey } from '../gemini/geminiSettings.js';
import { recognizeCoordinateWithGemini } from '../gemini/geminiClient.js';

export async function recognizeImageText(file, { onProgress } = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Open Settings to add it before scanning.');
  }

  return recognizeCoordinateWithGemini(file, { apiKey, onProgress });
}
