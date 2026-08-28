import { GEMINI_MODEL } from './geminiSettings.js';

const INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GENERATE_CONTENT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const API_REVISION = '2026-05-20';
const TRANSIENT_STATUS = new Set([500, 502, 503, 504]);

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

function extractInteractionOutputText(payload) {
  if (payload?.output_text) return String(payload.output_text);

  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (step?.type !== 'model_output' || !Array.isArray(step.content)) continue;
    const textBlock = step.content.find((item) => item?.type === 'text' && item.text);
    if (textBlock?.text) return textBlock.text;
  }
  return '';
}

function extractGenerateContentText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('');
    if (text) return text;
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
  const detail = String(payload?.error?.message || payload?.message || '').trim();
  if ([400, 401, 403].includes(status)) {
    return 'Gemini API key was rejected or is not allowed to use this model. Check the key in Settings.';
  }
  if (status === 429) {
    return 'Gemini API quota or rate limit was reached. Try again later or check the API project quota.';
  }
  if (TRANSIENT_STATUS.has(status)) {
    return detail
      ? `Gemini API is temporarily unavailable (${status}: ${detail}). Retry the scan in a moment.`
      : `Gemini API is temporarily unavailable (${status}). Retry the scan in a moment.`;
  }
  return detail
    ? `Gemini API request failed (${status}): ${detail}`
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

function delay(milliseconds) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

async function requestJsonWithRetry(
  url,
  options,
  { fetchImpl = globalThis.fetch, retries = 2, sleepImpl = delay, onRetry } = {},
) {
  let attempt = 0;

  while (true) {
    const response = await fetchImpl(url, options);
    const payload = await readResponsePayload(response);

    if (response.ok || !TRANSIENT_STATUS.has(response.status) || attempt >= retries) {
      return { response, payload, attempt };
    }

    attempt += 1;
    onRetry?.(attempt, response.status);
    await sleepImpl(attempt === 1 ? 450 : 1100);
  }
}

function interactionsRequestBody(imageData, mimeType) {
  return {
    model: GEMINI_MODEL,
    store: false,
    input: [
      {
        type: 'image',
        mime_type: mimeType,
        data: imageData,
      },
      { type: 'text', text: COORDINATE_PROMPT },
    ],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: RESPONSE_SCHEMA,
    },
  };
}

function generateContentRequestBody(imageData, mimeType) {
  return {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: imageData,
            },
          },
          { text: COORDINATE_PROMPT },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 700,
      responseFormat: {
        text: {
          mimeType: 'application/json',
          schema: RESPONSE_SCHEMA,
        },
      },
    },
  };
}

function parseCoordinateResponse(payload, extractText) {
  const outputText = extractText(payload);
  let structured;
  try {
    structured = parseJsonText(outputText);
  } catch {
    throw new Error('Gemini returned an unreadable coordinate response. Try scanning the image again.');
  }

  return {
    structured,
    analysis: normalizeGeminiCoordinatePayload(structured),
  };
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

export async function testGeminiApiKey(
  apiKey,
  { fetchImpl = globalThis.fetch, sleepImpl = delay } = {},
) {
  const key = normalizedKey(apiKey);
  if (!key) throw new Error('Enter a Gemini API key first.');

  const { response, payload } = await requestJsonWithRetry(
    GENERATE_CONTENT_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Reply with READY.' }] }],
        generationConfig: { maxOutputTokens: 8 },
      }),
    },
    { fetchImpl, sleepImpl, retries: 1 },
  );

  if (!response.ok) throw new Error(apiErrorMessage(response.status, payload));
  return payload;
}

export async function recognizeCoordinateWithGemini(
  file,
  { apiKey, onProgress, fetchImpl = globalThis.fetch, sleepImpl = delay } = {},
) {
  const key = normalizedKey(apiKey);
  if (!key) {
    throw new Error('Gemini API key is not configured. Open Settings to add it before scanning.');
  }
  if (!file?.arrayBuffer) throw new Error('Choose a valid Cut Point image first.');

  onProgress?.({ status: 'Preparing image for Gemini', progress: 0.08 });
  const imageData = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';
  onProgress?.({ status: `Sending image to ${GEMINI_MODEL}`, progress: 0.3 });

  const interactionResult = await requestJsonWithRetry(
    INTERACTIONS_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
        'Api-Revision': API_REVISION,
      },
      body: JSON.stringify(interactionsRequestBody(imageData, mimeType)),
    },
    {
      fetchImpl,
      sleepImpl,
      retries: 2,
      onRetry: (attempt) =>
        onProgress?.({
          status: `Gemini service busy · retry ${attempt}/2`,
          progress: 0.3 + attempt * 0.08,
        }),
    },
  );

  let parsed;
  let transportLabel = 'Interactions API';

  if (interactionResult.response.ok) {
    onProgress?.({ status: 'Reading Gemini coordinate result', progress: 0.88 });
    parsed = parseCoordinateResponse(interactionResult.payload, extractInteractionOutputText);
  } else if (TRANSIENT_STATUS.has(interactionResult.response.status)) {
    onProgress?.({
      status: 'Gemini Interactions busy · switching transport',
      progress: 0.56,
    });

    const fallbackResult = await requestJsonWithRetry(
      GENERATE_CONTENT_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify(generateContentRequestBody(imageData, mimeType)),
      },
      {
        fetchImpl,
        sleepImpl,
        retries: 2,
        onRetry: (attempt) =>
          onProgress?.({
            status: `Gemini fallback busy · retry ${attempt}/2`,
            progress: 0.58 + attempt * 0.08,
          }),
      },
    );

    if (!fallbackResult.response.ok) {
      throw new Error(apiErrorMessage(fallbackResult.response.status, fallbackResult.payload));
    }

    transportLabel = 'Generate Content fallback';
    onProgress?.({ status: 'Reading Gemini coordinate result', progress: 0.9 });
    parsed = parseCoordinateResponse(fallbackResult.payload, extractGenerateContentText);
  } else {
    throw new Error(
      apiErrorMessage(interactionResult.response.status, interactionResult.payload),
    );
  }

  onProgress?.({ status: 'Gemini coordinate analysis complete', progress: 1 });

  return {
    text: parsed.structured.rawText ?? '',
    analysis: parsed.analysis,
    confidence: null,
    sourceLabel: `Gemini 3.6 Flash · ${transportLabel}`,
    attempts: [
      {
        id: `${GEMINI_MODEL}:${transportLabel}`,
        label: `Gemini 3.6 Flash · ${transportLabel}`,
        confidence: null,
        text: parsed.structured.rawText ?? '',
      },
    ],
  };
}
