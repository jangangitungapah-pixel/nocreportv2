const EVENT_LABELS = Object.freeze({
  TICKET_CREATED: 'Ticket created',
  TICKET_UPDATED: 'Ticket updated',
  STATUS_CHANGED: 'Status changed',
  PROGRESS_ADDED: 'Progress added',
  PROGRESS_UPDATED: 'Progress updated',
  PROGRESS_REMOVED: 'Progress removed',
  COORDINATE_UPDATED: 'Coordinate updated',
  COORDINATE_CLEARED: 'Coordinate cleared',
});

function eventLabel(type) {
  return EVENT_LABELS[type] ?? String(type ?? 'Audit event').replaceAll('_', ' ').toLowerCase();
}

function formatTimestamp(value) {
  if (!value) return 'Time unavailable';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return date.toLocaleString();
}

function displayValue(value) {
  if (value == null || value === '') return 'Empty';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Empty';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function changeEntries(event) {
  const changes = event?.details?.changes;
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return [];
  return Object.entries(changes);
}

export function RevisionHistoryPanel({ events = [], loading = false, error = null }) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
        <div>
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Revision History</h3>
          <p className="text-[9px] font-semibold text-[var(--text-faint)]">
            Read-only · latest 50 audit events
          </p>
        </div>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-faint)]">
          Admin audit
        </span>
      </header>

      {loading ? (
        <p className="px-3 py-4 text-[10px] text-[var(--text-muted)]">Loading revision history…</p>
      ) : error ? (
        <p className="px-3 py-4 text-[10px] font-semibold text-[var(--danger-text)]" role="alert">
          Revision history could not be loaded.
        </p>
      ) : events.length === 0 ? (
        <p className="px-3 py-4 text-[10px] text-[var(--text-muted)]">No audit history yet.</p>
      ) : (
        <ol className="divide-y divide-[var(--border-subtle)]">
          {events.map((event) => {
            const changes = changeEntries(event);
            const hasRevisionBoundary =
              Number.isFinite(event.revisionFrom) && Number.isFinite(event.revisionTo);

            return (
              <li key={event.id} className="px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10.5px] font-extrabold text-[var(--text-secondary)]">
                      {eventLabel(event.type)}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[var(--text-faint)]">
                      {formatTimestamp(event.createdAt)}
                      {hasRevisionBoundary
                        ? ` · revision ${event.revisionFrom} → ${event.revisionTo}`
                        : ''}
                    </p>
                  </div>
                  <span className="font-mono text-[9px] text-[var(--text-faint)]">
                    {event.actorUid ? `actor ${event.actorUid}` : 'actor unavailable'}
                  </span>
                </div>

                {event.type === 'TICKET_UPDATED' ? (
                  changes.length ? (
                    <div className="mt-2 grid gap-1.5">
                      {changes.map(([field, change]) => (
                        <div
                          key={field}
                          className="grid gap-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-1.5 sm:grid-cols-[150px_minmax(0,1fr)]"
                        >
                          <strong className="font-mono text-[9px] text-[var(--text-secondary)]">
                            {field}
                          </strong>
                          <span className="min-w-0 truncate text-[9.5px] text-[var(--text-muted)]">
                            {displayValue(change?.from)} → {displayValue(change?.to)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[9.5px] text-[var(--text-faint)]">
                      Legacy update event. Compact field diff was not recorded for this revision.
                    </p>
                  )
                ) : event.type === 'STATUS_CHANGED' && event.details ? (
                  <p className="mt-2 text-[9.5px] text-[var(--text-muted)]">
                    {event.details.fromStatus ?? 'Unknown'} → {event.details.toStatus ?? 'Unknown'}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
