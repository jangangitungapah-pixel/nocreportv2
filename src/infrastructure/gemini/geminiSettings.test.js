import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearGeminiApiKey,
  getGeminiApiKey,
  hasGeminiApiKey,
  maskGeminiApiKey,
  saveGeminiApiKey,
} from './geminiSettings.js';

describe('Gemini browser settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and clears the API key in browser storage', () => {
    saveGeminiApiKey('  AIza-test-key-1234  ');

    expect(getGeminiApiKey()).toBe('AIza-test-key-1234');
    expect(hasGeminiApiKey()).toBe(true);

    clearGeminiApiKey();

    expect(getGeminiApiKey()).toBe('');
    expect(hasGeminiApiKey()).toBe(false);
  });

  it('masks configured keys for settings status UI', () => {
    expect(maskGeminiApiKey('AIza-test-key-1234')).toBe('AIza••••••••1234');
    expect(maskGeminiApiKey('')).toBe('Not configured');
  });
});
