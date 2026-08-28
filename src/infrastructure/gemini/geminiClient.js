import { GEMINI_MODEL } from './geminiSettings.js';

const GENERATE_CONTENT_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
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
    let response;
    try {
      response = await fetchImpl(url, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Gemini browser request failed before a response was received. ${message || 'Check browser network access and API restrictions.'}`,
      );
    }

    const payload = await readResponsePayload(response);

    if (response.ok || !TRANSIENT_STATUS.has(response.status) || attempt >= retries) {
      return { response, payload, attempt };
    }

    attempt += 1;
    onRetry?.(attempt, response.status);
    await sleepImpl(attempt === 1 ? 450 : 1100);
  }
}

function generateContentRequestBody(imageData, mimeType) {
  return {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageData,
            },
          },
          { text: COORDINATE_PROMPT },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 700,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}

function parseCoordinateResponse(payload) {
  const outputText = extractGenerateContentText(payload);
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

  const result = await requestJsonWithRetry(
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
          status: `Gemini service busy · retry ${attempt}/2`,
          progress: 0.3 + attempt * 0.1,
        }),
    },
  );

  if (!result.response.ok) {
    throw new Error(apiErrorMessage(result.response.status, result.payload));
  }

  onProgress?.({ status: 'Reading Gemini coordinate result', progress: 0.9 });
  const parsed = parseCoordinateResponse(result.payload);
  onProgress?.({ status: 'Gemini coordinate analysis complete', progress: 1 });

  return {
    text: parsed.structured.rawText ?? '',
    analysis: parsed.analysis,
    confidence: null,
    sourceLabel: `${GEMINI_MODEL} · Generate Content`,
    attempts: [
      {
        id: `${GEMINI_MODEL}:generate-content`,
        label: `${GEMINI_MODEL} · Generate Content`,
        confidence: null,
        text: parsed.structured.rawText ?? '',
      },
    ],
  };
}
