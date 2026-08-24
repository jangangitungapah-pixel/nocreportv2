import { useState } from 'react';

import { formatProgressTime, sortProgressTimeline } from '../../../entities/ticket/index.js';
import { Button, DateTimeField, IconButton, Textarea, UiIcon } from '../../../shared/ui/index.jsx';

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
      <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-[var(--border-default)] bg-[var(--surface-panel)] p-5 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-muted)] text-xs font-black text-[var(--text-muted)]"
          aria-hidden="true"
        >
          0
        </span>
        No progress updates yet.
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="spatial-kicker">Incident history</p>
          <h3 className="mt-1.5 text-base font-bold">Recorded Progress</h3>
        </div>
        <span className="spatial-chip">{sorted.length} updates</span>
      </div>

      <div className="relative mt-5 space-y-1">
        <span
          className="absolute bottom-3 left-[21px] top-3 w-px bg-[var(--border-subtle)]"
          aria-hidden="true"
        />
        {sorted.map((entry) => {
          const group = dateKey(entry.occurredAt);
          const showGroup = group !== lastDate;
          lastDate = group;
          const editing = editingId === entry.id;

          return (
            <div key={entry.id} className="relative">
              {showGroup ? (
                <div className="relative z-10 flex items-center gap-3 pb-2 pt-4 first:pt-0">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[9px] font-black text-[var(--accent-text)] shadow-[var(--shadow-xs)]">
                    DAY
                  </span>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {group}
                  </p>
                </div>
              ) : null}

              {editing ? (
                <div className="relative z-10 ml-14 rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] p-3.5 shadow-[var(--shadow-xs)]">
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
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button tone="secondary" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={() => saveEdit(entry)}>Save correction</Button>
                  </div>
                </div>
              ) : (
                <div className="group relative z-10 ml-14 grid gap-2 rounded-2xl border border-transparent px-3 py-2.5 transition-[background-color,border-color] duration-200 hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)] sm:grid-cols-[68px_minmax(0,1fr)_auto] sm:items-start">
                  <time className="pt-1 font-mono text-xs font-bold tabular-nums text-[var(--accent-text)]">
                    {formatProgressTime(entry.occurredAt)}
                  </time>
                  <p className="pt-0.5 text-sm font-medium leading-6 text-[var(--text-primary)]">
                    {entry.text}
                  </p>
                  <div className="flex gap-1 opacity-100 transition sm:opacity-70 sm:group-hover:opacity-100">
                    <IconButton label="Edit progress update" onClick={() => beginEdit(entry)}>
                      <UiIcon name="edit" size={16} />
                    </IconButton>
                    <IconButton label="Remove progress update" onClick={() => onRemove(entry.id)}>
                      <UiIcon name="close" size={16} />
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
