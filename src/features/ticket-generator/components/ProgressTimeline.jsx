import { useState } from 'react';

import { formatProgressTime, sortProgressTimeline } from '../../../entities/ticket/index.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { DateTimeField, Textarea } from '../../../shared/ui/index.jsx';

function toInputValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function ProgressTimeline({ entries, onUpdate, onRemove }) {
  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [error, setError] = useState('');

  const sorted = sortProgressTimeline(entries);
  let lastDate = null;

  const beginEdit = (entry) => {
    setEditingId(entry.id);
    setDraftText(entry.text);
    setDraftTime(toInputValue(entry.occurredAt));
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftText('');
    setDraftTime('');
    setError('');
  };

  const saveEdit = (entry) => {
    const text = draftText.trim();
    const occurredAt = new Date(draftTime);

    if (!text || !draftTime || Number.isNaN(occurredAt.getTime())) {
      setError('A valid event time and progress text are required.');
      return;
    }

    onUpdate({ ...entry, text, occurredAt });
    cancelEdit();
  };

  if (sorted.length === 0) {
    return (
      <div className="generator-operations-empty generator-progress-empty rounded-[var(--radius-panel)] border border-dashed border-[var(--border-default)] bg-[var(--surface-panel)] px-3 py-3 text-xs font-medium text-[var(--text-muted)]">
        No progress updates yet.
      </div>
    );
  }

  return (
    <section className="generator-operations-surface generator-progress-history overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="generator-operations-header generator-progress-history__header flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
        <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Recorded Progress</h3>
        <span className="font-mono text-[9.5px] font-semibold text-[var(--text-faint)]">
          {sorted.length} update{sorted.length === 1 ? '' : 's'}
        </span>
      </header>

      <div className="divide-y divide-[var(--border-subtle)]">
        {sorted.map((entry) => {
          const group = dateKey(entry.occurredAt);
          const showGroup = group !== lastDate;
          lastDate = group;
          const editing = editingId === entry.id;

          return (
            <div key={entry.id}>
              {showGroup ? (
                <div className="generator-progress-date-band bg-[var(--surface-muted)] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
                  {group}
                </div>
              ) : null}

              {editing ? (
                <div className="generator-progress-editing grid gap-2.5 bg-[var(--accent-soft)] px-3 py-3">
                  <div className="grid gap-2.5 md:grid-cols-[190px_minmax(0,1fr)]">
                    <DateTimeField
                      id={`edit-progress-time-${entry.id}`}
                      label="Event time"
                      value={draftTime}
                      onChange={(event) => setDraftTime(event.target.value)}
                    />
                    <Textarea
                      id={`edit-progress-text-${entry.id}`}
                      label="Progress update"
                      value={draftText}
                      error={error}
                      rows={2}
                      onChange={(event) => {
                        setDraftText(event.target.value);
                        if (error) setError('');
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <Button tone="ghost" size="sm" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveEdit(entry)}>
                      Save correction
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="generator-progress-entry group grid gap-2 px-3 py-2.5 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-start">
                  <time className="pt-0.5 font-mono text-[10.5px] font-bold tabular-nums text-[var(--accent-text)]">
                    {formatProgressTime(entry.occurredAt)}
                  </time>
                  <p className="whitespace-pre-wrap text-[12.5px] font-medium leading-5 text-[var(--text-primary)]">
                    {entry.text}
                  </p>
                  <div className="flex justify-end gap-1 sm:opacity-65 sm:transition-opacity sm:group-hover:opacity-100">
                    <Button
                      tone="ghost"
                      size="icon"
                      aria-label="Edit progress update"
                      onClick={() => beginEdit(entry)}
                    >
                      <AppIcon name="edit" size={14} />
                    </Button>
                    <Button
                      tone="ghost"
                      size="icon"
                      aria-label="Remove progress update"
                      onClick={() => onRemove(entry.id)}
                    >
                      <AppIcon name="close" size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
