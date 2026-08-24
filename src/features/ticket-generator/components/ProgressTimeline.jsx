import { useState } from 'react';

import { formatProgressTime, sortProgressTimeline } from '../../../entities/ticket/index.js';
import { Button, DateTimeField, IconButton, Textarea } from '../../../shared/ui/index.jsx';

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
      <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-panel)] p-5 text-sm text-[var(--text-secondary)]">
        No progress updates yet.
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="text-sm font-bold">Recorded Progress</h3>
      <div className="mt-4 space-y-2">
        {sorted.map((entry) => {
          const group = dateKey(entry.occurredAt);
          const showGroup = group !== lastDate;
          lastDate = group;
          const editing = editingId === entry.id;

          return (
            <div key={entry.id}>
              {showGroup ? (
                <p className="pb-2 pt-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] first:pt-0">
                  {group}
                </p>
              ) : null}

              {editing ? (
                <div className="rounded-xl border border-[var(--accent-solid)] bg-[var(--accent-soft)] p-3">
                  <div className="grid gap-3 md:grid-cols-[210px_minmax(0,1fr)]">
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
                  <div className="mt-3 flex justify-end gap-2">
                    <Button tone="secondary" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={() => saveEdit(entry)}>Save correction</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-2 py-2 hover:bg-[var(--surface-muted)]">
                  <time className="pt-1 text-sm font-bold tabular-nums text-[var(--text-muted)]">
                    {formatProgressTime(entry.occurredAt)}
                  </time>
                  <p className="pt-1 text-sm leading-5 text-[var(--text-primary)]">{entry.text}</p>
                  <div className="flex gap-1">
                    <IconButton label="Edit progress update" onClick={() => beginEdit(entry)}>
                      ✎
                    </IconButton>
                    <IconButton label="Remove progress update" onClick={() => onRemove(entry.id)}>
                      ×
                    </IconButton>
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
