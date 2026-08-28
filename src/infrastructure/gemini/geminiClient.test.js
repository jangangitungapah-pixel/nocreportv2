import { describe, expect, it, vi } from 'vitest';

import {
  normalizeGeminiCoordinatePayload,
  recognizeCoordinateWithGemini,
  testGeminiApiKey,
} from './geminiClient.js';

function mockResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  };
}

describe('Gemini coordinate client', () => {
  it('normalizes a successful Gemini coordinate payload', () => {
    expect(
      normalizeGeminiCoordinatePayload({
        status: 'success',
        latitude: -6.12345,
        longitude: 107.12345,
        format: 'DD',
        formatted: '-6.12345, 107.12345',
        rawText: 'Lat -6.12345 Long 107.12345',
        candidates: [],
      }),
    ).toEqual({
      status: 'success',
      latitude: -6.12345,
      longitude: 107.12345,
      formatted: '-6.12345, 107.12345',
      format: 'DD',
      normalizedText: 'Lat -6.12345 Long 107.12345',
    });
  });

  it('keeps multiple valid candidates ambiguous', () => {
    const result = normalizeGeminiCoordinatePayload({
      status: 'ambiguous',
      rawText: '-6.1 107.1 / -6.2 107.2',
      candidates: [
        { latitude: -6.1, longitude: 107.1 },
        { latitude: -6.2, longitude: 107.2 },
      ],
    });

    expect(result.status).toBe('ambiguous');
    expect(result.candidates).toHaveLength(2);
  });

  it('tests the key against the actual inference endpoint and retries transient failures', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(503, { error: { message: 'backend busy' } }))
      .mockResolvedValueOnce(
        mockResponse(200, {
          candidates: [{ content: { parts: [{ text: 'READY' }] } }],
        }),
      );
    const sleepImpl = vi.fn().mockResolvedValue(undefined);

    await expect(testGeminiApiKey('AIza-test', { fetchImpl, sleepImpl })).resolves.toEqual(
      expect.objectContaining({ candidates: expect.any(Array) }),
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenLastCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-goog-api-key': 'AIza-test' }),
      }),
    );
    expect(sleepImpl).toHaveBeenCalledTimes(1);
  });

  it('scans coordinates through generateContent without calling Interactions', async () => {
    const structured = JSON.stringify({
      status: 'success',
      latitude: -6.2,
      longitude: 106.8,
      formatted: '-6.2, 106.8',
      format: 'DD',
      rawText: '-6.2, 106.8',
      candidates: [],
    });
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse(200, {
        candidates: [{ content: { parts: [{ text: structured }] } }],
      }),
    );
    const sleepImpl = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn();
    const file = {
      type: 'image/png',
      arrayBuffer: vi.fn().mockResolvedValue(Uint8Array.from([1, 2, 3]).buffer),
    };

    const result = await recognizeCoordinateWithGemini(file, {
      apiKey: 'AIza-test',
      fetchImpl,
      sleepImpl,
      onProgress,
    });

    expect(result.analysis).toEqual(
      expect.objectContaining({ status: 'success', latitude: -6.2, longitude: 106.8 }),
    );
    expect(result.sourceLabel).toBe('gemini-3.6-flash · Generate Content');
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, request] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    );
    expect(url).not.toContain('/interactions');

    const body = JSON.parse(request.body);
    expect(body.contents[0].parts[0]).toEqual({
      inlineData: {
        mimeType: 'image/png',
        data: 'AQID',
      },
    });
    expect(body.generationConfig).toEqual(
      expect.objectContaining({
        responseMimeType: 'application/json',
        responseSchema: expect.any(Object),
      }),
    );
  });

  it('retries transient generateContent failures during coordinate scans', async () => {
    const structured = JSON.stringify({
      status: 'not_found',
      rawText: '',
      candidates: [],
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(503, { error: { message: 'busy' } }))
      .mockResolvedValueOnce(
        mockResponse(200, {
          candidates: [{ content: { parts: [{ text: structured }] } }],
        }),
      );
    const sleepImpl = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn();
    const file = {
      type: 'image/jpeg',
      arrayBuffer: vi.fn().mockResolvedValue(Uint8Array.from([1]).buffer),
    };

    await expect(
      recognizeCoordinateWithGemini(file, {
        apiKey: 'AIza-test',
        fetchImpl,
        sleepImpl,
        onProgress,
      }),
    ).resolves.toEqual(expect.objectContaining({ analysis: expect.objectContaining({ status: 'not_found' }) }));

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Gemini service busy · retry 1/2' }),
    );
  });
});
