export const GEMINI_MODEL = 'gemini-3.7-flash';

const STORAGE_KEY = 'nocreportv2:gemini-api-key:v1';
const SETTINGS_EVENT = 'nocreport:gemini-settings-change';

function storageAvailable() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getGeminiApiKey() {
  if (!storageAvailable()) return '';
  try {
    return window.localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(apiKey) {
  const normalized = String(apiKey ?? '').trim();
  if (!storageAvailable()) return normalized;

  try {
    if (normalized) window.localStorage.setItem(STORAGE_KEY, normalized);
    else window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new globalThis.Event(SETTINGS_EVENT));
  } catch {
    // A privacy-restricted browser may reject localStorage. The caller still keeps
    // the in-memory value, while OCR will surface that no persisted key is available.
  }

  return normalized;
}

export function clearGeminiApiKey() {
  saveGeminiApiKey('');
}

export function hasGeminiApiKey() {
  return Boolean(getGeminiApiKey());
}

export function subscribeGeminiSettings(listener) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(SETTINGS_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(SETTINGS_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export function maskGeminiApiKey(apiKey) {
  const normalized = String(apiKey ?? '').trim();
  if (!normalized) return 'Not configured';
  if (normalized.length <= 8) return '••••••••';
  return `${normalized.slice(0, 4)}••••••••${normalized.slice(-4)}`;
}
