import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../app/components/PageHeader.jsx';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { ErrorState, Skeleton, StatusBadge } from '../../../shared/ui/index.jsx';

const EMPTY_SUMMARY = {
  runningCount: 0,
  ticketsTodayCount: 0,
  resolvedTodayCount: 0,
  cutPointCount: 0,
  recentlyUpdated: [],
};

function formatDateTime(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

const METRIC_META = Object.freeze([
  { key: 'runningCount', label: 'Running', hint: 'active now', accent: 'var(--success-solid)' },
  { key: 'ticketsTodayCount', label: 'Today', hint: 'occurred today', accent: 'var(--accent-solid)' },
  { key: 'resolvedTodayCount', label: 'Resolved', hint: 'resolved today', accent: 'var(--accent-cyan)' },
  { key: 'cutPointCount', label: 'Cut Points', hint: 'with coordinates', accent: 'var(--accent-violet)' },
]);

function MetricStrip({ summary }) {
  return (
    <section
      aria-label="Today's operational pulse"
      className="grid overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] sm:grid-cols-2 xl:grid-cols-4"
    >
      {METRIC_META.map((metric, index) => (
        <article
          key={metric.key}
          className="relative min-h-[78px] px-3 py-2.5 sm:px-4 xl:border-l xl:border-[var(--border-subtle)] xl:first:border-l-0"
        >
          <span
            className="absolute inset-x-0 top-0 h-0.5 opacity-80"
            style={{ background: metric.accent }}
            aria-hidden="true"
          />
          {index > 0 ? (
            <span
              className="absolute inset-x-3 top-0 h-px bg-[var(--border-subtle)] sm:hidden"
              aria-hidden="true"
            />
          ) : null}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[var(--text-muted)]">
                {metric.label}
              </p>
              <p className="mt-1 font-[var(--font-display)] text-[28px] font-bold leading-none tracking-[-0.055em] text-[var(--text-primary)]">
                {summary[metric.key]}
              </p>
            </div>
            <span className="mb-0.5 text-[10px] font-semibold text-[var(--text-faint)]">
              {metric.hint}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-3" role="status" aria-label="Loading Dashboard">
      <Skeleton className="h-20" />
      <Skeleton className="h-64" />
    </div>
  );
}

function RecentTicketRow({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="group grid min-h-[54px] select-none gap-1.5 border-t border-[var(--border-subtle)] px-3 py-2.5 transition-colors first:border-t-0 hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] md:grid-cols-[140px_minmax(0,1fr)_110px_128px] md:items-center md:gap-3 md:px-4 md:py-2"
    >
      <p className="truncate font-mono text-[11px] font-bold text-[var(--text-muted)]">
        {ticket.externalTtNumber ?? 'No TT detected'}
      </p>
      <p className="line-clamp-2 min-w-0 text-[13px] font-semibold leading-5 tracking-[-0.01em] text-[var(--text-primary)] md:truncate">
        {ticket.title || 'Untitled ticket'}
      </p>
      <div className="flex items-center md:block">
        <StatusBadge status={ticket.status} />
      </div>
      <p className="text-[11px] font-medium text-[var(--text-muted)] md:text-right">
        {formatDateTime(ticket.updatedAt)}
      </p>
    </Link>
  );
}

function RecentActivity({ tickets }) {
  return (
    <section
      aria-labelledby="dashboard-recent-heading"
      className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
    >
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <h3 id="dashboard-recent-heading" className="text-sm font-bold text-[var(--text-primary)]">
            Recently updated
          </h3>
          <span className="font-mono text-[10px] font-semibold text-[var(--text-faint)]">
            {tickets.length} latest
          </span>
        </div>
        <Button asChild tone="ghost" size="sm">
          <Link to="/running">Open queue</Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="grid min-h-36 place-items-center px-4 py-7 text-center">
          <div>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">No persisted Tickets yet.</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Recent operational activity will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="hidden min-h-8 grid-cols-[140px_minmax(0,1fr)_110px_128px] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--text-faint)] md:grid">
            <span>TT</span>
            <span>Incident</span>
            <span>Status</span>
            <span className="text-right">Updated</span>
          </div>
          {tickets.map((ticket) => (
            <RecentTicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </section>
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
    <div className="grid gap-3">
      <PageHeader
        title="Operational overview"
        eyebrow="Dashboard"
        description={
          localDevelopmentMode ? 'Cloud data unavailable in local preview.' : 'Live ticket pulse and recent activity.'
        }
        actions={
          canCreateTicket ? (
            <Button asChild tone="primary" size="sm">
              <Link to="/generator/new">
                <AppIcon name="plus" size={14} />
                New Ticket
              </Link>
            </Button>
          ) : null
        }
      />

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
          <MetricStrip summary={summary} />
          <RecentActivity tickets={summary.recentlyUpdated} />
        </>
      ) : null}
    </div>
  );
}
