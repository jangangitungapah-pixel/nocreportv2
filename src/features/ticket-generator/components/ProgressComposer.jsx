import { useMemo, useState } from 'react';

import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { DateTimeField, Textarea } from '../../../shared/ui/index.jsx';

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

export function ProgressComposer({ onAdd }) {
  const initialTime = useMemo(() => toInputValue(new Date()), []);
  const [occurredAt, setOccurredAt] = useState(initialTime);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      </header>

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
        <Button size="sm" disabled={submitting} onClick={() => void submit()}>
          <AppIcon name="plus" size={14} />
          {submitting ? 'Adding…' : 'Add update'}
        </Button>
      </div>
    </section>
  );
}
