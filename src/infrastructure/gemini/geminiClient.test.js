import { describe, expect, it, vi } from 'vitest';

import { normalizeGeminiCoordinatePayload, testGeminiApiKey } from './geminiClient.js';

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

  it('tests a key against the configured Gemini model without running inference', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ name: 'models/gemini-3.7-flash' }),
    });

    await expect(testGeminiApiKey('AIza-test', { fetchImpl })).resolves.toEqual({
      name: 'models/gemini-3.7-flash',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash',
      expect.objectContaining({
        method: 'GET',
        headers: { 'x-goog-api-key': 'AIza-test' },
      }),
    );
  });
});
