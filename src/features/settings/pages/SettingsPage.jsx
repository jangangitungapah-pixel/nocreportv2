import { useState } from 'react';

import { PageHeader } from '../../../app/components/PageHeader.jsx';
import { testGeminiApiKey } from '../../../infrastructure/gemini/geminiClient.js';
import {
  GEMINI_MODEL,
  clearGeminiApiKey,
  getGeminiApiKey,
  maskGeminiApiKey,
  saveGeminiApiKey,
} from '../../../infrastructure/gemini/geminiSettings.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { TextInput } from '../../../shared/ui/index.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';

function ConnectionState({ state }) {
  if (!state.message) return null;

  const toneClass =
    state.tone === 'success'
      ? 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]'
      : state.tone === 'error'
        ? 'border-[var(--danger-solid)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
        : 'border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)]';

  return (
    <div
      className={`rounded-[var(--radius-control)] border px-3 py-2 text-xs font-semibold ${toneClass}`}
      role={state.tone === 'error' ? 'alert' : 'status'}
    >
      {state.message}
    </div>
  );
}

export function SettingsPage() {
  const [apiKey, setApiKey] = useState(() => getGeminiApiKey());
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionState, setConnectionState] = useState({ tone: 'idle', message: '' });
  const savedKey = getGeminiApiKey();

  const saveKey = (event) => {
    event.preventDefault();
    const normalized = saveGeminiApiKey(apiKey);
    setApiKey(normalized);
    setConnectionState({
      tone: normalized ? 'success' : 'idle',
      message: normalized
        ? 'Gemini API key saved in this browser.'
        : 'Gemini API key removed from this browser.',
    });
  };

  const clearKey = () => {
    clearGeminiApiKey();
    setApiKey('');
    setConnectionState({ tone: 'idle', message: 'Gemini API key removed from this browser.' });
  };

  const testConnection = async () => {
    const key = apiKey.trim();
    if (!key) {
      setConnectionState({ tone: 'error', message: 'Enter a Gemini API key before testing.' });
      return;
    }

    setTesting(true);
    setConnectionState({ tone: 'idle', message: `Checking access to ${GEMINI_MODEL}…` });
    try {
      await testGeminiApiKey(key);
      setConnectionState({
        tone: 'success',
        message: `Connection ready. ${GEMINI_MODEL} is available for Coordinate OCR.`,
      });
    } catch (error) {
      setConnectionState({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Gemini API connection failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid gap-3">
      <PageHeader
        title="Settings"
        eyebrow="Workspace"
        description="Configure browser-scoped integrations used by NOCReport."
      />

      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent-text)]">
              <AppIcon name="settings" size={16} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
                Gemini Coordinate OCR
              </h2>
              <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                Multimodal coordinate extraction
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-1 font-mono text-[9px] font-bold text-[var(--text-muted)]">
            {savedKey ? maskGeminiApiKey(savedKey) : 'Not configured'}
          </span>
        </header>

        <form onSubmit={saveKey}>
          <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-5">
            <div className="grid gap-3">
              <TextInput
                id="gemini-api-key"
                label="Gemini API key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setConnectionState({ tone: 'idle', message: '' });
                }}
                autoComplete="off"
                spellCheck={false}
                placeholder="AIza…"
                hint="Stored only in this browser. It is not written to Firestore, GitHub, or the production bundle."
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button tone="secondary" size="sm" onClick={() => setShowKey((value) => !value)}>
                  {showKey ? 'Hide key' : 'Show key'}
                </Button>
                <Button tone="secondary" size="sm" disabled={testing} onClick={testConnection}>
                  {testing ? 'Testing…' : 'Test connection'}
                </Button>
              </div>

              <ConnectionState state={connectionState} />
            </div>

            <aside className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3.5">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                OCR runtime
              </p>
              <dl className="mt-3 grid gap-2.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold text-[var(--text-muted)]">Model</dt>
                  <dd className="font-mono font-bold text-[var(--text-primary)]">
                    {GEMINI_MODEL}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold text-[var(--text-muted)]">Image handling</dt>
                  <dd className="font-bold text-[var(--text-primary)]">Gemini API</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold text-[var(--text-muted)]">Storage</dt>
                  <dd className="font-bold text-[var(--text-primary)]">Browser only</dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[10px] leading-4 text-[var(--text-muted)]">
                When Scan coordinates is pressed, the selected Cut Point image is sent to the Gemini
                API for analysis. The request is stateless and is configured with store disabled.
              </p>
            </aside>
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] px-4 py-3 lg:px-5">
            {savedKey ? (
              <Button tone="ghost" size="sm" onClick={clearKey}>
                Remove key
              </Button>
            ) : null}
            <Button tone="primary" size="sm" type="submit">
              Save API key
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
