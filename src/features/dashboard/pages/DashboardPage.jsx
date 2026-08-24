import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { ErrorState, Skeleton, StatusBadge } from '../../../shared/ui/index.jsx';

const EMPTY_SUMMARY = {
  runningCount: 0,
  ticketsTodayCount: 0,
  resolvedTodayCount: 0,
  cutPointCount: 0,
  recentlyUpdated: [],
};

const primaryLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent-solid)] px-4 text-sm font-semibold text-[var(--accent-on-solid)] transition hover:bg-[var(--accent-solid-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';

function formatDateTime(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function MetricCard({ label, value, hint }) {
  return (
    <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

function RecentTicketRow({ ticket }) {
  return (
    <Link
      to={`/generator/${ticket.id}`}
      className="grid gap-2 border-t border-[var(--border-subtle)] px-4 py-3 transition hover:bg-[var(--surface-muted)] md:grid-cols-[minmax(0,1fr)_120px_150px] md:items-center"
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-semibold text-[var(--text-secondary)]">
          {ticket.externalTtNumber ?? 'No TT detected'}
        </p>
        <p className="mt-1 truncate text-sm font-semibold">{ticket.title || 'Untitled ticket'}</p>
      </div>
      <StatusBadge status={ticket.status} />
      <div className="text-xs text-[var(--text-muted)] md:text-right">
        {formatDateTime(ticket.updatedAt)}
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const { localDevelopmentMode, can } = useAuth();
  const canCreateTicket = can(CAPABILITY.CREATE_TICKET);
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
          <p className="text-sm font-medium text-[var(--text-muted)]">Today at a glance</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Operational overview</h2>
        </div>
        {canCreateTicket ? (
          <Link to="/generator/new" className={primaryLinkClass}>
            New Ticket
          </Link>
        ) : null}
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
              : error.code === 'FIRESTORE_PRECONDITION'
                ? 'A required Firestore index is not deployed or is still building. Deploy firestore.indexes.json, wait until the index is enabled, then retry.'
                : 'Check the network/Firebase configuration and try again.'
          }
          onRetry={loadSummary}
        />
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Running Tickets"
              value={summary.runningCount}
              hint="Currently active"
            />
            <MetricCard
              label="Tickets Today"
              value={summary.ticketsTodayCount}
              hint="Occur Time falls today"
            />
            <MetricCard
              label="Resolved Today"
              value={summary.resolvedTodayCount}
              hint="Resolved during today"
            />
            <MetricCard
              label="Cut Points"
              value={summary.cutPointCount}
              hint="Verified coordinate available"
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div>
                <h3 className="text-sm font-bold">Recently updated</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Latest operational Tickets across Draft, Running, and Resolved.
                </p>
              </div>
            </div>

            {summary.recentlyUpdated.length === 0 ? (
              <div className="border-t border-[var(--border-subtle)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No persisted Tickets yet.
              </div>
            ) : (
              summary.recentlyUpdated.map((ticket) => (
                <RecentTicketRow key={ticket.id} ticket={ticket} />
              ))
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
