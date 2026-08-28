import { GEMINI_MODEL } from './geminiSettings.js';

const INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MODEL_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;

const COORDINATE_PROMPT = `You extract geographic coordinates from NOC cut-point photos.
Inspect all visible text, especially small camera/geotag watermark overlays.
Do not infer a location from landmarks, scenery, addresses, or contextual clues.
Only return coordinates that are visibly present in the image.
Support decimal degrees (DD) and degree/minute/second formats (DMS), and convert DMS to decimal degrees.
Latitude must be between -90 and 90. Longitude must be between -180 and 180.
If exactly one valid coordinate pair is visible, return status "success".
If multiple distinct valid coordinate pairs are visible, return status "ambiguous" and include each pair in candidates.
If no valid visible coordinate pair exists, return status "not_found".
rawText should contain only the coordinate-related text you actually read from the image.
Never guess missing digits or signs.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['success', 'ambiguous', 'not_found'] },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    formatted: { type: 'string' },
    format: { type: 'string' },
    rawText: { type: 'string' },
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          formatted: { type: 'string' },
          format: { type: 'string' },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  required: ['status', 'rawText', 'candidates'],
};

function normalizedKey(apiKey) {
  return String(apiKey ?? '').trim();
}

function isValidCoordinate(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function formatCoordinate(latitude, longitude) {
  return `${latitude}, ${longitude}`;
}

function normalizeCandidate(candidate) {
  const latitude = Number(candidate?.latitude);
  const longitude = Number(candidate?.longitude);
  if (!isValidCoordinate(latitude, longitude)) return null;

  return {
    latitude,
    longitude,
    formatted: String(candidate?.formatted || formatCoordinate(latitude, longitude)),
    format: String(candidate?.format || 'DD'),
  };
}

function extractOutputText(payload) {
  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (step?.type !== 'model_output' || !Array.isArray(step.content)) continue;
    const textBlock = step.content.find((item) => item?.type === 'text' && item.text);
    if (textBlock?.text) return textBlock.text;
  }
  return '';
}

function parseJsonText(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) throw new Error('Gemini returned an empty coordinate response.');

  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(withoutFence);
}

function apiErrorMessage(status, payload) {
  const detail = payload?.error?.message || payload?.message || '';
  if ([400, 401, 403].includes(status)) {
    return 'Gemini API key was rejected. Check the key in Settings.';
  }
  if (status === 429) {
    return 'Gemini API quota or rate limit was reached. Try again later or check the API project quota.';
  }
  if (status >= 500) {
    return 'Gemini API is temporarily unavailable. Try scanning again in a moment.';
  }
  return detail
    ? `Gemini API request failed: ${detail}`
    : `Gemini API request failed (${status}).`;
}

async function readResponsePayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return globalThis.btoa(binary);
}

export function normalizeGeminiCoordinatePayload(payload) {
  const rawText = String(payload?.rawText ?? '').trim();
  const candidates = Array.isArray(payload?.candidates)
    ? payload.candidates.map(normalizeCandidate).filter(Boolean)
    : [];

  if (payload?.status === 'success') {
    const candidate = normalizeCandidate(payload);
    if (candidate) {
      return {
        status: 'success',
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        formatted: candidate.formatted,
        format: candidate.format,
        normalizedText: rawText,
      };
    }

    return {
      status: 'invalid',
      candidates: [],
      normalizedText: rawText,
    };
  }

  if (payload?.status === 'ambiguous' && candidates.length > 1) {
    return {
      status: 'ambiguous',
      candidates,
      normalizedText: rawText,
    };
  }

  if (payload?.status === 'ambiguous' && candidates.length === 1) {
    const [candidate] = candidates;
    return {
      status: 'success',
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      formatted: candidate.formatted,
      format: candidate.format,
      normalizedText: rawText,
    };
  }

  return {
    status: 'not_found',
    candidates: [],
    normalizedText: rawText,
  };
}

export async function testGeminiApiKey(apiKey, { fetchImpl = globalThis.fetch } = {}) {
  const key = normalizedKey(apiKey);
  if (!key) throw new Error('Enter a Gemini API key first.');

  const response = await fetchImpl(MODEL_ENDPOINT, {
    method: 'GET',
    headers: { 'x-goog-api-key': key },
  });

  const payload = await readResponsePayload(response);
  if (!response.ok) throw new Error(apiErrorMessage(response.status, payload));
  return payload;
}

export async function recognizeCoordinateWithGemini(
  file,
  { apiKey, onProgress, fetchImpl = globalThis.fetch } = {},
) {
  const key = normalizedKey(apiKey);
  if (!key) {
    throw new Error('Gemini API key is not configured. Open Settings to add it before scanning.');
  }
  if (!file?.arrayBuffer) throw new Error('Choose a valid Cut Point image first.');

  onProgress?.({ status: 'Preparing image for Gemini', progress: 0.08 });
  const imageData = await fileToBase64(file);
  onProgress?.({ status: `Sending image to ${GEMINI_MODEL}`, progress: 0.3 });

  const response = await fetchImpl(INTERACTIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      store: false,
      input: [
        {
          type: 'image',
          mime_type: file.type || 'image/jpeg',
          data: imageData,
        },
        { type: 'text', text: COORDINATE_PROMPT },
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: RESPONSE_SCHEMA,
      },
    }),
  });

  const responsePayload = await readResponsePayload(response);
  if (!response.ok) throw new Error(apiErrorMessage(response.status, responsePayload));

  onProgress?.({ status: 'Reading Gemini coordinate result', progress: 0.9 });
  const outputText = extractOutputText(responsePayload);
  let structured;
  try {
    structured = parseJsonText(outputText);
  } catch {
    throw new Error(
      'Gemini returned an unreadable coordinate response. Try scanning the image again.',
    );
  }

  const analysis = normalizeGeminiCoordinatePayload(structured);
  onProgress?.({ status: 'Gemini coordinate analysis complete', progress: 1 });

  return {
    text: structured.rawText ?? '',
    analysis,
    confidence: null,
    sourceLabel: 'Gemini 3.7 Flash',
    attempts: [
      {
        id: GEMINI_MODEL,
        label: 'Gemini 3.7 Flash',
        confidence: null,
        text: structured.rawText ?? '',
      },
    ],
  };
}
