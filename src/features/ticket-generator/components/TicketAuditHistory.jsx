import { useEffect, useMemo, useState } from 'react';

import { loadTicketRevisionHistory } from '../lib/persistenceService.js';

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

const AUDIT_TIME_ZONE = 'Asia/Jakarta';
const DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: AUDIT_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: AUDIT_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function boundedLimit(value) {
  return Math.min(Math.max(Number(value) || 50, 1), 50);
}

function toValidDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDay(value) {
  const date = toValidDate(value);
  return date ? DAY_FORMATTER.format(date) : 'Unknown date';
}

function formatTime(value) {
  const date = toValidDate(value);
  return date ? TIME_FORMATTER.format(date) : '--:--';
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

function groupEventsByDay(events) {
  const groups = [];
  for (const event of events) {
    const label = formatDay(event.createdAt);
    const latest = groups[groups.length - 1];
    if (latest?.label === label) {
      latest.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  }
  return groups;
}

export function TicketAuditHistory({ ticketId, enabled = false, limit = 50 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const safeLimit = boundedLimit(limit);

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
    void loadTicketRevisionHistory(ticketId, { limit: safeLimit })
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
  }, [enabled, safeLimit, ticketId]);

  const visibleEvents = useMemo(() => events.slice(0, safeLimit), [events, safeLimit]);
  const dayGroups = useMemo(() => groupEventsByDay(visibleEvents), [visibleEvents]);

  if (!enabled || !ticketId) return null;

  return (
    <section
      className="generator-output-surface generator-audit-history overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
      aria-label="Revision history"
    >
      <header className="generator-output-header generator-audit-history__header flex min-h-9 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
        <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Revision History</h3>
        {!loading && !error ? (
          <span className="font-mono text-[9px] font-semibold text-[var(--text-faint)]">
            {visibleEvents.length} event{visibleEvents.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </header>

      {loading ? (
        <p className="generator-audit-state px-3 py-3 text-[10px] text-[var(--text-muted)]">
          Loading revision history…
        </p>
      ) : null}
      {error ? (
        <p
          className="generator-audit-state generator-audit-state--error px-3 py-3 text-[10px] font-semibold text-[var(--danger-text)]"
          role="alert"
        >
          Revision history could not be loaded.
        </p>
      ) : null}
      {!loading && !error && !visibleEvents.length ? (
        <p className="generator-audit-state px-3 py-3 text-[10px] text-[var(--text-muted)]">
          No audit events recorded yet.
        </p>
      ) : null}

      {!loading && !error && dayGroups.length ? (
        <div className="generator-audit-days">
          {dayGroups.map((group) => (
            <section key={group.label} className="generator-audit-day">
              <div className="generator-audit-day__label border-y border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-muted)_54%,transparent)] px-3 py-1 text-[8.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--text-faint)] first:border-t-0">
                {group.label}
              </div>

              <div className="divide-y divide-[var(--border-subtle)]">
                {group.events.map((event) => {
                  const changes = changeEntries(event);
                  const summary = eventSummary(event);
                  return (
                    <article
                      key={event.id}
                      className="generator-audit-event grid grid-cols-[10px_minmax(0,1fr)_auto] gap-x-2 px-3 py-1.5"
                      data-event-type={event.type}
                    >
                      <span
                        className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[var(--accent-solid)] opacity-65"
                        aria-hidden="true"
                      />

                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <p className="text-[10.5px] font-bold text-[var(--text-secondary)]">
                            {EVENT_LABELS[event.type] ?? event.type}
                          </p>
                          {summary ? (
                            <p className="min-w-0 truncate text-[9.5px] text-[var(--text-muted)]">
                              {summary}
                            </p>
                          ) : null}
                        </div>

                        {changes.length ? (
                          <div className="mt-1 grid gap-0.5">
                            {changes.map(([field, change]) => (
                              <div
                                key={field}
                                className="generator-audit-change grid min-w-0 gap-x-2 border-l border-[var(--border-default)] pl-2 text-[9.5px] sm:grid-cols-[110px_minmax(0,1fr)]"
                              >
                                <strong className="text-[var(--text-secondary)]">
                                  {FIELD_LABELS[field] ?? field}
                                </strong>
                                <span className="min-w-0 break-words text-[var(--text-muted)]">
                                  {formatValue(change?.from)} → {formatValue(change?.to)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <time className="pt-px font-mono text-[9px] font-semibold tabular-nums text-[var(--text-faint)]">
                        {formatTime(event.createdAt)}
                      </time>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
