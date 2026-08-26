import { useMemo, useState } from 'react';

import { Button } from '../../../shared/ui/primitives.jsx';

const FIELD_LABELS = Object.freeze({
  title: 'Title',
  impactList: 'Impact List',
  occurAt: 'Occur Time',
  dispatchAt: 'Dispatch Time',
  pic: 'PIC',
  rootcause: 'Rootcause',
  cutPoint: 'Cut Point',
  latitude: 'Latitude',
  longitude: 'Longitude',
});

function displayValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item?.value ?? item ?? '').trim())
      .filter(Boolean)
      .join(', ');
  }
  if (value == null || value === '') return 'Empty';
  return String(value);
}

function recoveryReviewItems(currentValues, payload) {
  const draft = payload?.formValues ?? {};
  return Object.entries(FIELD_LABELS)
    .map(([field, label]) => {
      const current = displayValue(currentValues?.[field]);
      const recovered = displayValue(draft?.[field]);
      return current === recovered ? null : { field, label, current, recovered };
    })
    .filter(Boolean);
}

function formatDirtyAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

export function DraftRecoveryNotice({
  recovery,
  currentRevision = null,
  currentValues = {},
  onRestore,
  onDiscard,
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const payload = recovery?.payload ?? null;
  const stale = recovery?.state === 'stale';
  const available = recovery?.state === 'available' || stale;
  const reviewItems = useMemo(
    () => (stale ? recoveryReviewItems(currentValues, payload) : []),
    [currentValues, payload, stale],
  );

  if (!available || !payload) return null;

  return (
    <section
      className="rounded-[var(--radius-panel)] border border-[var(--warning-border)] bg-[var(--warning-soft)] px-3 py-3 shadow-[var(--shadow-xs)]"
      aria-label="Draft recovery"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold text-[var(--warning-text)]">
            {stale ? 'Older local draft found' : 'Local recovery draft found'}
          </p>
          <p className="mt-1 text-[10px] leading-5 text-[var(--text-muted)]">
            Saved locally {formatDirtyAt(payload.dirtyAt)}.
            {stale
              ? ` It was based on revision ${payload.baseRevision}; this Ticket is now revision ${currentRevision}. Review differences before applying it.`
              : ' Nothing from this recovery snapshot has been written to Firestore.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {stale ? (
            <Button type="button" size="xs" tone="secondary" onClick={() => setReviewOpen(true)}>
              Review stale draft
            </Button>
          ) : (
            <Button type="button" size="xs" onClick={onRestore}>
              Restore
            </Button>
          )}
          <Button type="button" size="xs" tone="ghost" onClick={onDiscard}>
            Discard
          </Button>
        </div>
      </div>

      {stale && reviewOpen ? (
        <div className="mt-3 border-t border-[var(--warning-border)] pt-3">
          <div className="grid gap-2">
            {reviewItems.length ? (
              reviewItems.map((item) => (
                <div
                  key={item.field}
                  className="grid gap-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-2 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <strong className="text-[10px] text-[var(--text-secondary)]">{item.label}</strong>
                  <span className="truncate text-[10px] text-[var(--text-faint)]" title={item.current}>
                    Current: {item.current}
                  </span>
                  <span
                    className="truncate text-[10px] text-[var(--warning-text)]"
                    title={item.recovered}
                  >
                    Draft: {item.recovered}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-[var(--text-muted)]">
                No core form differences remain. The draft may only contain local Progress or metadata.
              </p>
            )}
          </div>
          <div className="mt-2 flex justify-end gap-1.5">
            <Button type="button" size="xs" tone="ghost" onClick={() => setReviewOpen(false)}>
              Close review
            </Button>
            <Button type="button" size="xs" onClick={onRestore}>
              Apply reviewed draft
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
