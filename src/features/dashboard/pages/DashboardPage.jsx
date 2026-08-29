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
  { key: 'runningCount', label: 'Running', hint: 'active now' },
  {
    key: 'ticketsTodayCount',
    label: 'Today',
    hint: 'occurred today',
  },
  {
    key: 'resolvedTodayCount',
    label: 'Resolved',
    hint: 'resolved today',
  },
  {
    key: 'cutPointCount',
    label: 'Cut Points',
    hint: 'with coordinates',
  },
]);

function MetricStrip({ summary }) {
  return (
    <section
      aria-label="Today's operational pulse"
      className="dashboard-metric-strip grid overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] sm:grid-cols-2 xl:grid-cols-4"
    >
      {METRIC_META.map((metric, index) => (
        <article
          key={metric.key}
          className="dashboard-metric relative min-h-[78px] px-3 py-2.5 sm:px-4 xl:border-l xl:border-[var(--border-subtle)] xl:first:border-l-0"
        >
          {index > 0 ? (
            <span
              className="dashboard-metric__mobile-divider absolute inset-x-3 top-0 h-px bg-[var(--border-subtle)] sm:hidden"
              aria-hidden="true"
            />
          ) : null}
          <div className="dashboard-metric__layout flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="dashboard-metric__label text-[10px] font-bold uppercase tracking-[0.11em] text-[var(--text-muted)]">
                {metric.label}
              </p>
              <p className="dashboard-metric__value mt-1 font-[var(--font-display)] text-[26px] font-semibold leading-none tracking-[-0.05em] text-[var(--text-primary)]">
                {summary[metric.key]}
              </p>
            </div>
            <span className="dashboard-metric__hint mb-0.5 text-[10px] font-medium text-[var(--text-faint)]">
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
      className="dashboard-ticket-row group grid min-h-[54px] select-none gap-1.5 border-t border-[var(--border-subtle)] px-3 py-2.5 transition-colors first:border-t-0 hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] md:grid-cols-[140px_minmax(0,1fr)_110px_128px] md:items-center md:gap-3 md:px-4 md:py-2"
    >
      <p className="dashboard-ticket-row__tt truncate font-mono text-[11px] font-bold text-[var(--text-muted)]">
        {ticket.externalTtNumber ?? 'No TT detected'}
      </p>
      <p className="dashboard-ticket-row__title line-clamp-2 min-w-0 text-[13px] font-semibold leading-5 tracking-[-0.01em] text-[var(--text-primary)] md:truncate">
        {ticket.title || 'Untitled ticket'}
      </p>
      <div className="dashboard-ticket-row__status flex items-center md:block">
        <StatusBadge status={ticket.status} />
      </div>
      <p className="dashboard-ticket-row__time text-[11px] font-medium text-[var(--text-muted)] md:text-right">
        {formatDateTime(ticket.updatedAt)}
      </p>
    </Link>
  );
}

function RecentActivity({ tickets }) {
  return (
    <section
      aria-labelledby="dashboard-recent-heading"
      className="dashboard-activity overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
    >
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <h3
            id="dashboard-recent-heading"
            className="text-sm font-bold text-[var(--text-primary)]"
          >
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
        <div className="dashboard-activity__empty grid min-h-28 place-items-center px-4 py-6 text-center">
          <div className="max-w-sm">
            <span
              className="dashboard-activity__empty-mark mx-auto mb-3 block h-1 w-8 rounded-full bg-[var(--accent-solid)]"
              aria-hidden="true"
            />
            <p className="text-[13px] font-semibold text-[var(--text-secondary)]">
              No persisted Tickets yet.
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Recent operational activity will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="hidden min-h-8 grid-cols-[140px_minmax(0,1fr)_110px_128px] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--text-muted)] md:grid">
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
    <div className="page-stack dashboard-page grid gap-3">
      <PageHeader
        title="Operational overview"
        eyebrow="Dashboard"
        description={
          localDevelopmentMode
            ? 'Cloud data unavailable in local preview.'
            : 'Live ticket pulse and recent activity.'
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