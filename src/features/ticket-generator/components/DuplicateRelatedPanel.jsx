import { Link } from 'react-router-dom';

import { Button } from '../../../shared/ui/primitives.jsx';

function formatTimestamp(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function CandidateCard({
  candidate,
  canRelate,
  hasUnsavedChanges,
  relatePending,
  onRelate,
}) {
  const evidence = candidate.duplicateEvidence ?? {};
  const reasons = Array.isArray(evidence.reasons) ? evidence.reasons : [];

  return (
    <article className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-[10.5px] font-extrabold text-[var(--text-primary)]">
            {candidate.externalTtNumber ?? candidate.incidentKey ?? candidate.id}
          </p>
          <p className="mt-0.5 text-[9.5px] font-semibold text-[var(--text-faint)]">
            {candidate.status} · Occur {formatTimestamp(candidate.occurAt)} · Updated{' '}
            {formatTimestamp(candidate.updatedAt)}
          </p>
        </div>
        <span className="rounded-full border border-[var(--warning-border)] bg-[var(--warning-soft)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--warning-text)]">
          {evidence.level ?? 'review'} · {evidence.score ?? 0}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {reasons.map((reason) => (
          <span
            key={reason.code}
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-0.5 text-[9px] font-semibold text-[var(--text-secondary)]"
          >
            {reason.label}
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Button asChild tone="ghost" size="sm">
          <Link to={`/tickets/${candidate.id}`}>Review existing Ticket</Link>
        </Button>
        {canRelate ? (
          <Button
            tone="secondary"
            size="sm"
            disabled={hasUnsavedChanges || relatePending}
            onClick={() => onRelate(candidate)}
          >
            {relatePending ? 'Linking…' : 'Link as related'}
          </Button>
        ) : (
          <span className="text-[9px] font-semibold text-[var(--text-faint)]">
            Save this Ticket first to link incidents.
          </span>
        )}
      </div>
    </article>
  );
}

export function DuplicateRelatedPanel({
  candidates = [],
  duplicatePending = false,
  duplicateError = null,
  duplicateAcknowledged = false,
  onCreateAnyway,
  canRelate = false,
  hasUnsavedChanges = false,
  relatePendingId = null,
  onRelate,
  relatedGroup = null,
  relatedTickets = [],
  relatedPending = false,
  relatedError = null,
  unlinkPending = false,
  onUnlinkCurrent,
}) {
  const hasCandidates = candidates.length > 0;
  const hasRelated = Boolean(relatedGroup);

  if (
    !duplicatePending &&
    !duplicateError &&
    !hasCandidates &&
    !hasRelated &&
    !relatedPending &&
    !relatedError
  ) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">
        <div>
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">
            Duplicate & Related Tickets
          </h3>
          <p className="text-[9.5px] font-semibold text-[var(--text-faint)]">
            Advisory evidence only · bounded Firestore reads
          </p>
        </div>
        {hasCandidates ? (
          <span className="rounded-full border border-[var(--warning-border)] bg-[var(--warning-soft)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--warning-text)]">
            {candidates.length} candidate{candidates.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </header>

      <div className="grid gap-3 p-3">
        {duplicatePending ? (
          <p className="text-[10.5px] text-[var(--text-muted)]">Checking bounded duplicate signals…</p>
        ) : null}
        {duplicateError ? (
          <p className="text-[10.5px] text-[var(--danger-text)]">
            Duplicate lookup could not be completed. Creation remains available.
          </p>
        ) : null}

        {hasCandidates ? (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-[var(--text-secondary)]">
                Possible duplicate or related incidents
              </p>
              {!duplicateAcknowledged ? (
                <Button tone="secondary" size="sm" onClick={onCreateAnyway}>
                  Create anyway
                </Button>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                  Reviewed · create allowed
                </span>
              )}
            </div>
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                canRelate={canRelate}
                hasUnsavedChanges={hasUnsavedChanges}
                relatePending={relatePendingId === candidate.id}
                onRelate={onRelate}
              />
            ))}
          </div>
        ) : null}

        {hasRelated || relatedPending || relatedError ? (
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-extrabold text-[var(--text-primary)]">Related Tickets</p>
                {relatedGroup ? (
                  <p className="text-[9px] font-semibold text-[var(--text-faint)]">
                    Group {relatedGroup.id} · {relatedGroup.ticketIds.length} member
                    {relatedGroup.ticketIds.length === 1 ? '' : 's'}
                  </p>
                ) : null}
              </div>
              {hasRelated && onUnlinkCurrent ? (
                <Button
                  tone="ghost"
                  size="sm"
                  disabled={hasUnsavedChanges || unlinkPending}
                  onClick={onUnlinkCurrent}
                >
                  {unlinkPending ? 'Unlinking…' : 'Unlink current Ticket'}
                </Button>
              ) : null}
            </div>

            {relatedPending ? (
              <p className="mt-2 text-[10.5px] text-[var(--text-muted)]">Loading related Tickets…</p>
            ) : null}
            {relatedError ? (
              <p className="mt-2 text-[10.5px] text-[var(--danger-text)]">
                {relatedError.message ?? 'Related Tickets could not be loaded.'}
              </p>
            ) : null}
            {relatedTickets.length ? (
              <div className="mt-2 grid gap-1.5">
                {relatedTickets.map((related) => (
                  <div
                    key={related.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[10px] font-bold text-[var(--text-primary)]">
                        {related.externalTtNumber ?? related.incidentKey ?? related.id}
                      </p>
                      <p className="text-[9px] font-semibold text-[var(--text-faint)]">
                        {related.status} · Updated {formatTimestamp(related.updatedAt)}
                      </p>
                    </div>
                    <Button asChild tone="ghost" size="sm">
                      <Link to={`/tickets/${related.id}`}>Review</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
