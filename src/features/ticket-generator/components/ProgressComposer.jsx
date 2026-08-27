import { useEffect, useMemo, useState } from 'react';

import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { DateTimeField, SelectField, TextInput, Textarea } from '../../../shared/ui/index.jsx';
import { EVENT_TIME_BEHAVIOR } from '../lib/operatorPresets.js';
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

function defaultEventTime(behavior) {
  return behavior === EVENT_TIME_BEHAVIOR.BLANK ? '' : toInputValue(new Date());
}

function createLocalId() {
  if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `progress-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ProgressComposer({
  onAdd,
  profileId = 'MANDAU_DEFAULT',
  recoveryDraft = null,
  onDraftChange = null,
  favoriteSnippetIds = null,
  onFavoriteSnippetIdsChange = null,
  eventTimeBehavior = EVENT_TIME_BEHAVIOR.NOW,
}) {
  const profile = getTemplateProfile(profileId) ?? getTemplateProfile();
  const snippets = profile?.snippetCollection ?? [];
  const validSnippetIds = useMemo(() => snippets.map((snippet) => snippet.id), [snippets]);
  const initialTime = useMemo(() => defaultEventTime(eventTimeBehavior), [eventTimeBehavior]);
  const [occurredAt, setOccurredAt] = useState(initialTime);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [snippetError, setSnippetError] = useState('');
  const [localFavoriteIds, setLocalFavoriteIds] = useState(() =>
    readProgressSnippetFavorites({ validIds: validSnippetIds }),
  );
  const controlledFavorites = Array.isArray(favoriteSnippetIds);
  const favoriteIds = useMemo(() => {
    const source = controlledFavorites ? favoriteSnippetIds : localFavoriteIds;
    return source.filter((id) => validSnippetIds.includes(id));
  }, [controlledFavorites, favoriteSnippetIds, localFavoriteIds, validSnippetIds]);

  useEffect(() => {
    if (controlledFavorites) return;
    setLocalFavoriteIds((current) => current.filter((id) => validSnippetIds.includes(id)));
  }, [controlledFavorites, validSnippetIds]);

  useEffect(() => {
    if (!recoveryDraft) return;
    const recoveredTime = String(recoveryDraft.occurredAt ?? '').trim();
    setOccurredAt(recoveredTime || defaultEventTime(eventTimeBehavior));
    setText(String(recoveryDraft.text ?? ''));
    setError('');
    setSnippetError('');
  }, [eventTimeBehavior, recoveryDraft]);

  const publishDraft = (nextOccurredAt, nextText) => {
    onDraftChange?.({ occurredAt: nextOccurredAt, text: nextText });
  };

  const selectedSnippet = snippets.find((snippet) => snippet.id === selectedSnippetId) ?? null;
  const orderedSnippets = useMemo(() => {
    const favorites = new Set(favoriteIds);
    return [...snippets].sort((left, right) => {
      const favoriteOrder = Number(favorites.has(right.id)) - Number(favorites.has(left.id));
      if (favoriteOrder !== 0) return favoriteOrder;
      return snippets.indexOf(left) - snippets.indexOf(right);
    });
  }, [favoriteIds, snippets]);
  const snippetOptions = useMemo(
    () => [
      { value: '', label: 'Choose a reusable update…' },
      ...orderedSnippets.map((snippet) => ({
        value: snippet.id,
        label: `${favoriteIds.includes(snippet.id) ? '★ ' : ''}[${snippet.category}] ${snippet.label}`,
      })),
    ],
    [favoriteIds, orderedSnippets],
  );

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
      setSnippetError(
        `Fill required placeholder${labels.length === 1 ? '' : 's'}: ${labels.join(', ')}`,
      );
      return;
    }

    setText(result.text);
    publishDraft(occurredAt, result.text);
    setSnippetError('');
    setError('');
  };

  const toggleFavorite = () => {
    if (!selectedSnippet) return;
    const next = toggleProgressSnippetFavorite(selectedSnippet.id, favoriteIds);
    if (!controlledFavorites) setLocalFavoriteIds(next);
    onFavoriteSnippetIdsChange?.(next);
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
      const nextOccurredAt = defaultEventTime(eventTimeBehavior);
      setText('');
      setError('');
      setOccurredAt(nextOccurredAt);
      publishDraft(nextOccurredAt, '');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="generator-operations-surface generator-progress-composer overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="generator-operations-header generator-progress-composer__header flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Add Progress</h3>
          <span className="hidden text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)] sm:inline">
            Ctrl / ⌘ + Enter
          </span>
        </div>
        <span className="text-[9px] font-bold text-[var(--text-faint)]">
          {favoriteIds.length
            ? `${favoriteIds.length} local favorite${favoriteIds.length === 1 ? '' : 's'}`
            : 'Profile snippets'}
        </span>
      </header>

      <div className="generator-progress-snippet-deck border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1fr)_auto] lg:items-end">
          <SelectField
            id="progress-quick-snippet"
            label="Quick snippet"
            value={selectedSnippetId}
            onValueChange={selectSnippet}
            options={snippetOptions}
          />

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
              {selectedSnippet && favoriteIds.includes(selectedSnippet.id)
                ? '★ Favorite'
                : '☆ Favorite'}
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

      <div className="generator-progress-compose-grid grid gap-2.5 p-3 lg:grid-cols-[190px_minmax(0,1fr)_auto] lg:items-end">
        <DateTimeField
          id="progress-time"
          label="Event time"
          value={occurredAt}
          onChange={(event) => {
            const nextOccurredAt = event.target.value;
            setOccurredAt(nextOccurredAt);
            publishDraft(nextOccurredAt, text);
          }}
        />
        <Textarea
          id="progress-text"
          label="Progress update"
          rows={2}
          value={text}
          error={error}
          placeholder="team OTW ke lokasi CP, ETA 75 menit"
          onChange={(event) => {
            const nextText = event.target.value;
            setText(nextText);
            publishDraft(occurredAt, nextText);
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
