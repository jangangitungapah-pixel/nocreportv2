import { useEffect, useMemo, useState } from 'react';

import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { DateTimeField, TextInput, Textarea } from '../../../shared/ui/index.jsx';
import {
  readProgressSnippetFavorites,
  resolveProgressSnippet,
  toggleProgressSnippetFavorite,
} from '../lib/progressSnippets.js';
import { getTemplateProfile } from '../lib/templateProfiles.js';

function toInputValue(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function createLocalId() {
  if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `progress-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ProgressComposer({ onAdd, profileId = 'MANDAU_DEFAULT' }) {
  const profile = getTemplateProfile(profileId) ?? getTemplateProfile();
  const snippets = profile?.snippetCollection ?? [];
  const validSnippetIds = useMemo(() => snippets.map((snippet) => snippet.id), [snippets]);
  const initialTime = useMemo(() => toInputValue(new Date()), []);
  const [occurredAt, setOccurredAt] = useState(initialTime);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [snippetError, setSnippetError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(() =>
    readProgressSnippetFavorites({ validIds: validSnippetIds }),
  );

  useEffect(() => {
    setFavoriteIds((current) => current.filter((id) => validSnippetIds.includes(id)));
  }, [validSnippetIds]);

  const selectedSnippet = snippets.find((snippet) => snippet.id === selectedSnippetId) ?? null;
  const orderedSnippets = useMemo(() => {
    const favorites = new Set(favoriteIds);
    return [...snippets].sort((left, right) => {
      const favoriteOrder = Number(favorites.has(right.id)) - Number(favorites.has(left.id));
      if (favoriteOrder !== 0) return favoriteOrder;
      return snippets.indexOf(left) - snippets.indexOf(right);
    });
  }, [favoriteIds, snippets]);

  const selectSnippet = (id) => {
    setSelectedSnippetId(id);
    setPlaceholderValues({});
    setSnippetError('');
  };

  const insertSnippet = () => {
    if (!selectedSnippet) return;
    const result = resolveProgressSnippet(selectedSnippet, placeholderValues);
    if (!result.resolved) {
      const labels = result.missingKeys.map(
        (key) => selectedSnippet.placeholders.find((item) => item.key === key)?.label ?? key,
      );
      setSnippetError(`Fill required placeholder${labels.length === 1 ? '' : 's'}: ${labels.join(', ')}`);
      return;
    }

    setText(result.text);
    setSnippetError('');
    setError('');
  };

  const toggleFavorite = () => {
    if (!selectedSnippet) return;
    setFavoriteIds((current) => toggleProgressSnippetFavorite(selectedSnippet.id, current));
  };

  const submit = async () => {
    if (submitting) return;

    const normalizedText = text.trim();
    const date = new Date(occurredAt);

    if (!normalizedText) {
      setError('Progress update cannot be empty.');
      return;
    }
    if (!occurredAt || Number.isNaN(date.getTime())) {
      setError('Progress time is required.');
      return;
    }

    const entry = {
      id: createLocalId(),
      occurredAt: date,
      text: normalizedText,
      createdAt: new Date(),
      createdBy: null,
    };

    setSubmitting(true);
    try {
      const accepted = await onAdd(entry);
      if (accepted === false) return;
      setText('');
      setError('');
      setOccurredAt(toInputValue(new Date()));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="generator-progress-composer overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Add Progress</h3>
          <span className="hidden text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)] sm:inline">
            Ctrl / ⌘ + Enter
          </span>
        </div>
        <span className="text-[9px] font-bold text-[var(--text-faint)]">
          {favoriteIds.length ? `${favoriteIds.length} local favorite${favoriteIds.length === 1 ? '' : 's'}` : 'Profile snippets'}
        </span>
      </header>

      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1fr)_auto] lg:items-end">
          <label className="grid gap-1 text-[10.5px] font-bold text-[var(--text-secondary)]">
            Quick snippet
            <select
              className="min-h-9 w-full rounded-[var(--radius-control)] border border-[var(--border-default)] bg-[var(--surface-panel)] px-2.5 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--border-accent)]"
              value={selectedSnippetId}
              onChange={(event) => selectSnippet(event.target.value)}
            >
              <option value="">Choose a reusable update…</option>
              {orderedSnippets.map((snippet) => (
                <option key={snippet.id} value={snippet.id}>
                  {favoriteIds.includes(snippet.id) ? '★ ' : ''}[{snippet.category}] {snippet.label}
                </option>
              ))}
            </select>
          </label>

          {selectedSnippet ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedSnippet.placeholders.map((item) => (
                <TextInput
                  key={item.key}
                  id={`progress-snippet-${item.key}`}
                  label={`${item.label}${item.required ? ' *' : ''}`}
                  value={placeholderValues[item.key] ?? ''}
                  onChange={(event) => {
                    setPlaceholderValues((current) => ({
                      ...current,
                      [item.key]: event.target.value,
                    }));
                    if (snippetError) setSnippetError('');
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="self-center text-[10px] leading-5 text-[var(--text-muted)]">
              Snippets only fill the editor. Review or edit the text before submitting.
            </p>
          )}

          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              tone="ghost"
              size="xs"
              disabled={!selectedSnippet}
              aria-label={
                selectedSnippet
                  ? favoriteIds.includes(selectedSnippet.id)
                    ? `Remove ${selectedSnippet.label} from favorites`
                    : `Add ${selectedSnippet.label} to favorites`
                  : 'Favorite Progress snippet'
              }
              onClick={toggleFavorite}
            >
              {selectedSnippet && favoriteIds.includes(selectedSnippet.id) ? '★ Favorite' : '☆ Favorite'}
            </Button>
            <Button type="button" size="xs" disabled={!selectedSnippet} onClick={insertSnippet}>
              Insert snippet
            </Button>
          </div>
        </div>
        {snippetError ? (
          <p className="mt-2 text-[10px] font-bold text-[var(--danger-text)]" role="alert">
            {snippetError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2.5 p-3 lg:grid-cols-[190px_minmax(0,1fr)_auto] lg:items-end">
        <DateTimeField
          id="progress-time"
          label="Event time"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
        />
        <Textarea
          id="progress-text"
          label="Progress update"
          rows={2}
          value={text}
          error={error}
          placeholder="team OTW ke lokasi CP, ETA 75 menit"
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError('');
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <Button type="button" size="sm" disabled={submitting} onClick={() => void submit()}>
          <AppIcon name="plus" size={14} />
          {submitting ? 'Adding…' : 'Add update'}
        </Button>
      </div>
    </section>
  );
}
