import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { formatDateTime } from '../../../entities/ticket/index.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../../../shared/ui/index.jsx';

const primaryLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent-solid)] px-4 text-sm font-semibold text-[var(--accent-on-solid)] transition hover:bg-[var(--accent-solid-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';

const EMPTY_SUMMARY = Object.freeze({
  runningCount: 0,
  ticketsTodayCount: 0,
  resolvedTodayCount: 0,
  cutPointCount: 0,
  recentlyUpdated: [],
});

function MetricCard({ label, value, hint }) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-56" />
    </div>
  );
}

function RecentTicketRow({ ticket }) {
  return (
    <Link
      to={`/generator/${ticket.id}`}
      className="grid gap-3 border-t border-[var(--border-subtle)] px-4 py-3 transition first:border-t-0 hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
            {ticket.externalTtNumber ?? 'No TT detected'}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">
          {ticket.title || 'Untitled ticket'}
        </p>
        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
          {ticket.latestProgress?.text || ticket.cutPoint || 'No progress update yet'}
        </p>
      </div>
      <div className="text-xs text-[var(--text-muted)] md:text-right">
        <p>Updated</p>
        <p className="mt-1 font-medium text-[var(--text-secondary)]">
          {formatDateTime(ticket.updatedAt) || '—'}
        </p>
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const { localDevelopmentMode } = useAuth();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(!localDevelopmentMode);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async () => {
    if (localDevelopmentMode) {
      setSummary(EMPTY_SUMMARY);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setSummary(await firestoreTicketRepository.getDashboardSummary());
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [localDevelopmentMode]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">Operational overview</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Link to="/generator/new" className={primaryLinkClass}>
          New Ticket
        </Link>
      </div>

      {localDevelopmentMode ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
          Local preview mode is active. Configure Firebase environment values to load operational
          counts and recent Ticket data; the Generator remains fully usable locally.
        </div>
      ) : null}

      {loading ? <DashboardSkeleton /> : null}

      {!loading && error ? (
        <ErrorState
          title="Dashboard data could not be loaded"
          description={
            error.code === 'PERMISSION_DENIED'
              ? 'Your account does not have permission to read operational Ticket data.'
              : 'Check the network/Firebase configuration and try again.'
          }
          onRetry={loadSummary}
        />
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Running Tickets" value={summary.runningCount} hint="Currently active" />
            <MetricCard label="Tickets Today" value={summary.ticketsTodayCount} hint="Occurred today" />
            <MetricCard label="With Coordinates" value={summary.cutPointCount} hint="Map-ready records" />
            <MetricCard
              label="Resolved Today"
              value={summary.resolvedTodayCount}
              hint="Resolved since local midnight"
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <h3 className="text-sm font-bold">Recently Updated Tickets</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Bounded to the latest operational records.
                </p>
              </div>
              <Link
                to="/running"
                className="text-sm font-semibold text-[var(--accent-text)] hover:underline"
              >
                Open Running Ticket
              </Link>
            </div>

            {summary.recentlyUpdated.length > 0 ? (
              <div>
                {summary.recentlyUpdated.map((ticket) => (
                  <RecentTicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <div className="p-4 pt-0">
                <EmptyState
                  title={localDevelopmentMode ? 'No cloud data in local preview' : 'No tickets yet'}
                  description={
                    localDevelopmentMode
                      ? 'Create reports locally now, or configure Firebase later to persist operational records.'
                      : 'Create the first Ticket to start the operational history.'
                  }
                  action={
                    <Link to="/generator/new" className={primaryLinkClass}>
                      Create Ticket
                    </Link>
                  }
                />
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
