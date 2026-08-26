import { useEffect, useMemo, useState } from 'react';

import { loadTicketAuditHistory } from '../lib/persistenceService.js';

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

const FIELD_LABELS = Object.freeze({
  title: 'Title',
  titleMode: 'Title mode',
  externalTtNumber: 'External TT',
  templateProfileId: 'Template profile',
  incidentKey: 'Incident key',
  pathKey: 'Path key',
  impactList: 'Impact',
  occurAt: 'Occur Time',
  dispatchAt: 'Dispatch Time',
  pic: 'PIC',
  rootcause: 'Rootcause',
  cutPoint: 'Cut Point',
  'alarmContext.alarmFamily': 'Alarm family',
  'alarmContext.alarmSource': 'Alarm source',
  'alarmContext.emsAlarmNo': 'EMS Alarm No',
  'alarmContext.siteId': 'Site ID',
  'alarmContext.siteName': 'Site name',
  'alarmContext.severity': 'Severity',
  'alarmContext.sourceStatus': 'Source status',
  'alarmContext.dispatchTo': 'Dispatch to',
  'alarmContext.region': 'Region',
  'alarmContext.lastLinkFlapped': 'Last link flapped',
  'alarmContext.transportFamily': 'Transport family',
  'alarmContext.pathEndpoints': 'Path endpoints',
  'alarmContext.externalTtReferences': 'Related TT references',
});

function formatTime(value) {
  if (!value) return 'Unknown time';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

function formatValue(value) {
  if (value == null || value === '') return 'Empty';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Empty';
  return String(value);
}

function eventSummary(event) {
  if (event.type === 'STATUS_CHANGED') {
    const from = event.details?.fromStatus ?? 'Unknown';
    const to = event.details?.toStatus ?? 'Unknown';
    return `${from} → ${to}`;
  }
  if (event.type?.startsWith('PROGRESS_') && event.details?.progressId) {
    return `Progress ${event.details.progressId}`;
  }
  if (event.type === 'TICKET_UPDATED' && event.revisionFrom != null && event.revisionTo != null) {
    return `Revision ${event.revisionFrom} → ${event.revisionTo}`;
  }
  return null;
}

function changeEntries(event) {
  const changes = event.type === 'TICKET_UPDATED' ? event.details?.changes : null;
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return [];
  return Object.entries(changes);
}

export function TicketAuditHistory({ ticketId, enabled = false, limit = 50 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !ticketId) {
      setEvents([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError(null);
    void loadTicketAuditHistory(ticketId, { limit })
      .then((items) => {
        if (active) setEvents(items);
      })
      .catch((loadError) => {
        if (active) setError(loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, limit, ticketId]);

  const visibleEvents = useMemo(() => events.slice(0, Math.min(Math.max(Number(limit) || 50, 1), 50)), [events, limit]);

  if (!enabled || !ticketId) return null;

  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]" aria-label="Revision history">
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
        <div>
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Revision History</h3>
          <p className="text-[9px] font-semibold text-[var(--text-faint)]">Immutable audit · latest {Math.min(Math.max(Number(limit) || 50, 1), 50)}</p>
        </div>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-faint)]">Admin</span>
      </header>

      {loading ? <p className="px-3 py-4 text-[10px] text-[var(--text-muted)]">Loading revision history…</p> : null}
      {error ? (
        <p className="px-3 py-4 text-[10px] font-semibold text-[var(--danger-text)]" role="alert">
          Revision history could not be loaded.
        </p>
      ) : null}
      {!loading && !error && !visibleEvents.length ? (
        <p className="px-3 py-4 text-[10px] text-[var(--text-muted)]">No audit events recorded yet.</p>
      ) : null}

      {!loading && !error && visibleEvents.length ? (
        <div className="divide-y divide-[var(--border-subtle)]">
          {visibleEvents.map((event) => {
            const changes = changeEntries(event);
            const summary = eventSummary(event);
            return (
              <article key={event.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-extrabold text-[var(--text-secondary)]">
                      {EVENT_LABELS[event.type] ?? event.type}
                    </p>
                    {summary ? <p className="mt-0.5 text-[9.5px] text-[var(--text-muted)]">{summary}</p> : null}
                  </div>
                  <time className="text-[9px] font-semibold text-[var(--text-faint)]">{formatTime(event.createdAt)}</time>
                </div>

                {event.type === 'TICKET_UPDATED' && !changes.length ? (
                  <p className="mt-2 text-[9.5px] text-[var(--text-faint)]">Legacy update event. Compact field diff was not recorded for this revision.</p>
                ) : null}

                {changes.length ? (
                  <div className="mt-2 grid gap-1.5">
                    {changes.map(([field, change]) => (
                      <div key={field} className="grid gap-1 rounded-[var(--radius-control)] bg-[var(--surface-muted)] px-2 py-1.5 text-[9.5px] sm:grid-cols-[120px_minmax(0,1fr)]">
                        <strong className="text-[var(--text-secondary)]">{FIELD_LABELS[field] ?? field}</strong>
                        <span className="min-w-0 break-words text-[var(--text-muted)]">
                          {formatValue(change?.from)} → {formatValue(change?.to)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
