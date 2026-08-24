import { useMemo, useState } from 'react';

import { Button, DateTimeField, Textarea, UiIcon } from '../../../shared/ui/index.jsx';

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
    <section className="generator-progress-composer rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="spatial-kicker">Progress Timeline</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Add the latest operational update.
          </p>
        </div>
        <span className="spatial-chip hidden min-h-7 px-2.5 text-[10px] sm:inline-flex">
          Ctrl / ⌘ + Enter
        </span>
      </div>

      <div className="mt-3 grid gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-2.5 lg:grid-cols-[200px_minmax(0,1fr)_auto] lg:items-end">
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
        <Button className="lg:mb-px" disabled={submitting} onClick={() => void submit()}>
          <UiIcon name="plus" size={16} />
          {submitting ? 'Adding…' : 'Add update'}
        </Button>
      </div>
    </section>
  );
}
