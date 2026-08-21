import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import {
  TICKET_STATUS,
  formatDateTime,
  formatTicketReport,
} from '../../../entities/ticket/index.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import {
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TextInput,
} from '../../../shared/ui/index.jsx';

const primaryLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent-solid)] px-4 text-sm font-semibold text-[var(--accent-on-solid)] transition hover:bg-[var(--accent-solid-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';
const actionClass =
  'inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50';
const selectClass =
  'min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--focus-ring)]';
const MAX_REPORT_PROGRESS = 1000;

function matchesSearch(ticket, search) {
  if (!search) return true;
  const haystack = [ticket.externalTtNumber, ticket.title, ticket.pic, ticket.cutPoint]
    .filter(Boolean)
    .join('\n')
    .toLocaleLowerCase();
  return haystack.includes(search.toLocaleLowerCase());
}

function matchesCoordinateFilter(ticket, filter) {
  if (filter === 'with') return Boolean(ticket.hasCoordinates);
  if (filter === 'without') return !ticket.hasCoordinates;
  return true;
}

function dateMillis(value) {
  if (!(value instanceof Date)) return Number.NEGATIVE_INFINITY;
  return Number.isNaN(value.getTime()) ? Number.NEGATIVE_INFINITY : value.getTime();
}

function sortTickets(tickets, sort) {
  return [...tickets].sort((left, right) => {
    if (sort === 'occur-desc') return dateMillis(right.occurAt) - dateMillis(left.occurAt);
    if (sort === 'occur-asc') return dateMillis(left.occurAt) - dateMillis(right.occurAt);
    if (sort === 'title-asc') return (left.title ?? '').localeCompare(right.title ?? '');
    return dateMillis(right.updatedAt) - dateMillis(left.updatedAt);
  });
}

async function copyPlainText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error('Clipboard copy failed.');
}

async function loadProgressForReport(ticketId) {
  const progress = [];
  let cursor = null;

  do {
    const remaining = MAX_REPORT_PROGRESS - progress.length;
    const page = await firestoreTicketRepository.listProgress({
      ticketId,
      pageSize: Math.min(100, remaining),
      cursor,
      direction: 'asc',
    });
    progress.push(...page.items);

    if (page.hasMore && progress.length >= MAX_REPORT_PROGRESS) {
      const error = new Error('Progress history exceeds the quick-copy safety limit.');
      error.code = 'REPORT_PROGRESS_LIMIT';
      throw error;
    }

    cursor = page.hasMore ? page.nextCursor : null;
  } while (cursor);

  return progress;
}

function mutationErrorMessage(error, fallback) {
  if (error?.code === 'STALE_REVISION') {
    return 'This Ticket changed in another session. The Running list will refresh.';
  }
  if (error?.code === 'PERMISSION_DENIED') {
    return 'Your account does not have permission for this action.';
  }
  return fallback;
}

function TicketActions({ ticket, canMutate, copyPending, resolvePending, onCopy, onResolve }) {
  const ttLabel = ticket.externalTtNumber ?? ticket.title ?? 'Ticket';

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <Link to={`/generator/${ticket.id}`} className={actionClass}>
        Open
      </Link>
      {canMutate ? (
        <Link to={`/generator/${ticket.id}#progress-text`} className={actionClass}>
          Add Progress
        </Link>
      ) : null}
      <button
        type="button"
        className={actionClass}
        disabled={copyPending}
        aria-label={`Copy report for ${ttLabel}`}
        onClick={() => onCopy(ticket)}
      >
        {copyPending ? 'Copying…' : 'Copy Report'}
      </button>
      {canMutate ? (
        <button
          type="button"
          className={actionClass}
          disabled={resolvePending}
          aria-label={`Resolve ${ttLabel}`}
          onClick={() => onResolve(ticket)}
        >
          {resolvePending ? 'Resolving…' : 'Resolve'}
        </button>
      ) : null}
    </div>
  );
}

function TicketCard({ ticket, canMutate, copyPending, resolvePending, onCopy, onResolve }) {
  return (
    <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <StatusBadge status={ticket.status} />
          <p className="mt-2 font-mono text-xs font-semibold text-[var(--text-secondary)]">
            {ticket.externalTtNumber ?? 'No TT detected'}
          </p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {formatDateTime(ticket.updatedAt) || '—'}
        </p>
      </div>
      <h3 className="mt-3 text-sm font-bold leading-5">{ticket.title || 'Untitled ticket'}</h3>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[var(--text-muted)]">PIC</dt>
          <dd className="mt-1 text-[var(--text-secondary)]">{ticket.pic || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--text-muted)]">Cut Point</dt>
          <dd className="mt-1 text-[var(--text-secondary)]">{ticket.cutPoint || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--text-muted)]">Coordinate</dt>
          <dd className="mt-1 text-[var(--text-secondary)]">
            {ticket.hasCoordinates ? 'Available' : 'Not recorded'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--text-muted)]">Occur</dt>
          <dd className="mt-1 text-[var(--text-secondary)]">
            {formatDateTime(ticket.occurAt) || '—'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-[var(--text-muted)]">Latest Progress</dt>
          <dd className="mt-1 text-[var(--text-secondary)]">
            {ticket.latestProgress?.text || 'No progress update yet'}
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <TicketActions
          ticket={ticket}
          canMutate={canMutate}
          copyPending={copyPending}
          resolvePending={resolvePending}
          onCopy={onCopy}
          onResolve={onResolve}
        />
      </div>
    </article>
  );
}

function RunningSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading Running Tickets">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-48" />
      ))}
    </div>
  );
}

export function RunningTicketsPage() {
  const { localDevelopmentMode, role } = useAuth();
  const { pushToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [coordinateFilter, setCoordinateFilter] = useState('all');
  const [sort, setSort] = useState('updated-desc');
  const [loading, setLoading] = useState(!localDevelopmentMode);
  const [error, setError] = useState(null);
  const [copyPendingId, setCopyPendingId] = useState(null);
  const [resolvePendingId, setResolvePendingId] = useState(null);
  const canMutate = role === 'ADMIN' || role === 'OPERATOR';

  const loadTickets = useCallback(async () => {
    if (localDevelopmentMode) {
      setTickets([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setTickets(await firestoreTicketRepository.listRunningTickets({ limit: 100 }));
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [localDevelopmentMode]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const visibleTickets = useMemo(() => {
    const normalizedSearch = search.trim();
    return sortTickets(
      tickets.filter(
        (ticket) =>
          matchesSearch(ticket, normalizedSearch) &&
          matchesCoordinateFilter(ticket, coordinateFilter),
      ),
      sort,
    );
  }, [coordinateFilter, search, sort, tickets]);

  const copyReport = async (ticket) => {
    if (copyPendingId) return;
    setCopyPendingId(ticket.id);
    try {
      const [freshTicket, progress] = await Promise.all([
        firestoreTicketRepository.getTicketById(ticket.id),
        loadProgressForReport(ticket.id),
      ]);
      await copyPlainText(formatTicketReport({ ...freshTicket, progress }));
      pushToast({
        title: 'Report copied',
        message: 'The latest persisted Ticket and Progress Timeline are ready to paste.',
        tone: 'success',
      });
    } catch (copyError) {
      pushToast({
        title: 'Copy failed',
        message:
          copyError?.code === 'REPORT_PROGRESS_LIMIT'
            ? 'This Ticket has more than 1,000 progress updates. Open the Ticket for a controlled review before copying.'
            : 'The latest persisted report could not be loaded or copied.',
        tone: 'error',
      });
    } finally {
      setCopyPendingId(null);
    }
  };

  const resolveTicket = async (ticket) => {
    if (!canMutate || resolvePendingId) return;
    setResolvePendingId(ticket.id);
    try {
      await firestoreTicketRepository.transitionTicketStatus({
        ticketId: ticket.id,
        expectedRevision: ticket.revision,
        toStatus: TICKET_STATUS.RESOLVED,
      });
      setTickets((current) => current.filter((item) => item.id !== ticket.id));
      pushToast({
        title: 'Ticket resolved',
        message: 'The Ticket left the Running queue immediately.',
        tone: 'success',
      });
    } catch (resolveError) {
      pushToast({
        title: 'Resolve failed',
        message: mutationErrorMessage(resolveError, 'The Ticket could not be resolved.'),
        tone: 'error',
      });
      if (resolveError?.code === 'STALE_REVISION') await loadTickets();
    } finally {
      setResolvePendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">Active incidents</p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Running Ticket</h2>
            <StatusBadge status="RUNNING" />
          </div>
        </div>
        <Link to="/generator/new" className={primaryLinkClass}>
          New Ticket
        </Link>
      </div>

      {localDevelopmentMode ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
          Local preview mode has no persisted Running Tickets. Configure Firebase to enable this
          operational list.
        </div>
      ) : null}

      <section className="grid gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] lg:grid-cols-[minmax(0,1fr)_220px_220px] lg:items-end">
        <TextInput
          id="running-search"
          label="Search Running Tickets"
          placeholder="TT number, Title, PIC, or Cut Point"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Coordinate filter
          <select
            className={`mt-1.5 ${selectClass}`}
            value={coordinateFilter}
            aria-label="Coordinate filter"
            onChange={(event) => setCoordinateFilter(event.target.value)}
          >
            <option value="all">All Running</option>
            <option value="with">With coordinates</option>
            <option value="without">Without coordinates</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Sort
          <select
            className={`mt-1.5 ${selectClass}`}
            value={sort}
            aria-label="Sort Running Tickets"
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="updated-desc">Last updated</option>
            <option value="occur-desc">Occur newest</option>
            <option value="occur-asc">Occur oldest</option>
            <option value="title-asc">Title A–Z</option>
          </select>
        </label>
      </section>

      {!loading && !error && tickets.length > 0 ? (
        <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
          Showing {visibleTickets.length} of {tickets.length} Running Tickets.
        </p>
      ) : null}

      {loading ? <RunningSkeleton /> : null}

      {!loading && error ? (
        <ErrorState
          title="Running Tickets could not be loaded"
          description={
            error.code === 'PERMISSION_DENIED'
              ? 'Your account cannot read operational Ticket data.'
              : 'Check the network/Firebase configuration and try again.'
          }
          onRetry={loadTickets}
        />
      ) : null}

      {!loading && !error && visibleTickets.length === 0 ? (
        <EmptyState
          title={tickets.length === 0 ? 'No running tickets' : 'No tickets match your filters'}
          description={
            tickets.length === 0
              ? 'Tickets marked Running will appear here automatically.'
              : 'Try a different TT number, Title, PIC, Cut Point, or coordinate filter.'
          }
          action={
            tickets.length === 0 ? (
              <Link to="/generator/new" className={primaryLinkClass}>
                Create Ticket
              </Link>
            ) : null
          }
        />
      ) : null}

      {!loading && !error && visibleTickets.length > 0 ? (
        <>
          <div className="grid gap-3 md:hidden">
            {visibleTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                canMutate={canMutate}
                copyPending={copyPendingId === ticket.id}
                resolvePending={resolvePendingId === ticket.id}
                onCopy={copyReport}
                onResolve={resolveTicket}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)] md:block">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ticket</th>
                  <th className="px-4 py-3 font-semibold">Latest Progress</th>
                  <th className="px-4 py-3 font-semibold">PIC</th>
                  <th className="px-4 py-3 font-semibold">Cut Point</th>
                  <th className="px-4 py-3 font-semibold">Coordinate</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-[var(--border-subtle)] align-top">
                    <td className="max-w-sm px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                        {ticket.externalTtNumber ?? 'No TT detected'}
                      </p>
                      <p className="mt-1 line-clamp-2 font-semibold">
                        {ticket.title || 'Untitled ticket'}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Occur {formatDateTime(ticket.occurAt) || '—'}
                      </p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-[var(--text-secondary)]">
                      <p className="line-clamp-3">{ticket.latestProgress?.text || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{ticket.pic || '—'}</td>
                    <td className="max-w-xs px-4 py-3 text-[var(--text-secondary)]">
                      <p className="line-clamp-3">{ticket.cutPoint || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                      {ticket.hasCoordinates ? 'Available' : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
                      {formatDateTime(ticket.updatedAt) || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <TicketActions
                        ticket={ticket}
                        canMutate={canMutate}
                        copyPending={copyPendingId === ticket.id}
                        resolvePending={resolvePendingId === ticket.id}
                        onCopy={copyReport}
                        onResolve={resolveTicket}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
