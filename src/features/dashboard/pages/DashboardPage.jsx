import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { ErrorState, Skeleton, StatusBadge, UiIcon } from '../../../shared/ui/index.jsx';

const EMPTY_SUMMARY = {
  runningCount: 0,
  ticketsTodayCount: 0,
  resolvedTodayCount: 0,
  cutPointCount: 0,
  recentlyUpdated: [],
};

const primaryLinkClass =
  'inline-flex min-h-[var(--control-height)] select-none items-center justify-center gap-2 rounded-xl bg-[var(--accent-solid)] px-4 text-sm font-bold text-[var(--accent-on-solid)] shadow-[var(--shadow-accent)] transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--accent-solid-hover)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] active:scale-[0.985] active:translate-y-0';

function formatDateTime(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

const METRIC_META = {
  running: { mark: 'RN', accent: 'var(--success-solid)' },
  today: { mark: 'TD', accent: 'var(--accent-solid)' },
  resolved: { mark: 'OK', accent: 'var(--accent-cyan)' },
  cutpoint: { mark: 'CP', accent: 'var(--accent-violet)' },
};

function MetricCard({ label, value, hint, meta }) {
  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)] md:p-5">
      <div
        className="absolute inset-x-0 top-0 h-0.5 opacity-80"
        style={{ background: meta.accent }}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.06em] md:text-4xl">
            {value}
          </p>
        </div>
        <span
          className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[10px] font-extrabold text-[var(--text-muted)] transition group-hover:bg-[var(--surface-panel)] group-hover:text-[var(--text-primary)]"
          aria-hidden="true"
        >
          {meta.mark}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium leading-5 text-[var(--text-muted)]">{hint}</p>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading Dashboard">
      <Skeleton className="h-56" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
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
      className="group grid select-none gap-3 border-t border-[var(--border-subtle)] px-4 py-4 transition-[background-color,transform] duration-150 first:border-t-0 hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] active:scale-[0.997] md:grid-cols-[minmax(0,1fr)_120px_150px] md:items-center md:px-5"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-solid)] opacity-60 transition group-hover:opacity-100"
            aria-hidden="true"
          />
          <p className="truncate font-mono text-[11px] font-bold text-[var(--text-muted)]">
            {ticket.externalTtNumber ?? 'No TT detected'}
          </p>
        </div>
        <p className="mt-1.5 truncate text-sm font-bold tracking-[-0.015em] text-[var(--text-primary)]">
          {ticket.title || 'Untitled ticket'}
        </p>
      </div>
      <StatusBadge status={ticket.status} />
      <div className="text-xs font-medium text-[var(--text-muted)] md:text-right">
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
    <div className="space-y-5 md:space-y-6">
      <section className="spatial-panel-elevated relative overflow-hidden p-5 md:p-7 lg:p-8">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--accent-glow)] blur-3xl"
          aria-hidden="true"
        />
        <div
          className="spatial-dot-grid pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] opacity-25 lg:block"
          aria-hidden="true"
        />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div>
            <p className="spatial-kicker">Live operations</p>
            <h2 className="spatial-title mt-3 max-w-3xl">Operational overview</h2>
            <p className="spatial-description mt-4">
              Keep the active incident picture clear without digging through separate tools. Running
              work, today&apos;s movement, resolved cases, and verified Cut Points stay in one calm
              workspace.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {canCreateTicket ? (
                <Link to="/generator/new" className={primaryLinkClass}>
                  <UiIcon name="plus" size={16} />
                  New Ticket
                </Link>
              ) : null}
              <span className="spatial-chip">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--success-solid)]"
                  aria-hidden="true"
                />
                {localDevelopmentMode ? 'Preview mode' : 'Production connected'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-xs)] backdrop-blur-xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Workspace signal
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success-solid)] opacity-20" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--success-solid)]" />
              </span>
              <div>
                <p className="text-sm font-bold">Ready for operations</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {localDevelopmentMode
                    ? 'Cloud persistence disabled'
                    : 'Firebase workspace active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {localDevelopmentMode ? (
        <div className="rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] p-4 text-sm leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
          <span className="font-bold text-[var(--accent-text)]">Local preview.</span> Configure
          Firebase environment values to load operational counts and recent Ticket data; the
          Generator remains fully usable locally.
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
          <section>
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-sm font-bold">Today at a glance</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">Fast operational pulse.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Running Tickets"
                value={summary.runningCount}
                hint="Currently active"
                meta={METRIC_META.running}
              />
              <MetricCard
                label="Tickets Today"
                value={summary.ticketsTodayCount}
                hint="Occur Time falls today"
                meta={METRIC_META.today}
              />
              <MetricCard
                label="Resolved Today"
                value={summary.resolvedTodayCount}
                hint="Resolved during today"
                meta={METRIC_META.resolved}
              />
              <MetricCard
                label="Cut Points"
                value={summary.cutPointCount}
                hint="Verified coordinate available"
                meta={METRIC_META.cutpoint}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-4 md:px-5 md:py-5">
              <div>
                <p className="spatial-kicker">Activity feed</p>
                <h3 className="mt-1.5 text-lg font-bold">Recently updated</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  Latest operational Tickets across Draft, Running, and Resolved.
                </p>
              </div>
              <span className="spatial-chip">{summary.recentlyUpdated.length} latest</span>
            </div>

            {summary.recentlyUpdated.length === 0 ? (
              <div className="px-4 py-10 text-center md:px-5">
                <span
                  className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-[var(--surface-muted)] text-sm font-black text-[var(--text-muted)]"
                  aria-hidden="true"
                >
                  0
                </span>
                <p className="mt-3 text-sm font-semibold text-[var(--text-muted)]">
                  No persisted Tickets yet.
                </p>
              </div>
            ) : (
              <div>
                {summary.recentlyUpdated.map((ticket) => (
                  <RecentTicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
