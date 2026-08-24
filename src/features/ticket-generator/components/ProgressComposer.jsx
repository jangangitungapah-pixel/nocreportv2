import { useMemo, useState } from 'react';

import { Button, DateTimeField, Textarea } from '../../../shared/ui/index.jsx';

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
    <section className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="spatial-kicker">Live timeline</p>
          <h3 className="mt-1.5 text-base font-bold">Progress Timeline</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Add operational updates quickly. Ctrl/Cmd + Enter submits the current update.
          </p>
        </div>
        <span className="spatial-chip hidden sm:inline-flex">Ctrl / ⌘ + Enter</span>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-3 lg:grid-cols-[210px_minmax(0,1fr)_auto] lg:items-end lg:p-4">
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
          <span aria-hidden="true">＋</span>
          {submitting ? 'Adding…' : 'Add update'}
        </Button>
      </div>
    </section>
  );
}
