import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import {
  TICKET_STATUS,
  formatDateTime,
  formatTicketReport,
} from '../../../entities/ticket/index.js';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import {
  EmptyState,
  ErrorState,
  SelectField,
  Skeleton,
  StatusBadge,
  TextInput,
  UiIcon,
} from '../../../shared/ui/index.jsx';

const primaryLinkClass =
  'inline-flex min-h-[var(--control-height)] select-none items-center justify-center gap-2 rounded-xl bg-[var(--accent-solid)] px-4 text-sm font-bold text-[var(--accent-on-solid)] shadow-[var(--shadow-accent)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-solid-hover)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] active:scale-[0.985] active:translate-y-0';
const actionClass =
  'inline-flex min-h-10 select-none items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 text-xs font-bold text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:bg-[var(--surface-panel-strong)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-[0.975] active:translate-y-0 disabled:translate-y-0 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';
const MAX_REPORT_PROGRESS = 1000;

const COORDINATE_OPTIONS = [
  { value: 'all', label: 'All Running' },
  { value: 'with', label: 'With coordinates' },
  { value: 'without', label: 'Without coordinates' },
];

const SORT_OPTIONS = [
  { value: 'updated-desc', label: 'Last updated' },
  { value: 'occur-desc', label: 'Occur newest' },
  { value: 'occur-asc', label: 'Occur oldest' },
  { value: 'title-asc', label: 'Title A–Z' },
];

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
      <Link to={`/tickets/${ticket.id}`} className={actionClass}>
        Review
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
    <article className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]">
      <span
        className="absolute inset-y-5 left-0 w-0.5 rounded-full bg-[var(--success-solid)]"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-start justify-between gap-2 pl-1">
        <div>
          <StatusBadge status={ticket.status} />
          <p className="mt-2 font-mono text-[11px] font-bold text-[var(--text-muted)]">
            {ticket.externalTtNumber ?? 'No TT detected'}
          </p>
        </div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)]">
          {formatDateTime(ticket.updatedAt) || '—'}
        </p>
      </div>
      <h3 className="mt-3 pl-1 text-sm font-bold leading-6 tracking-[-0.015em]">
        <Link
          to={`/tickets/${ticket.id}`}
          className="rounded-sm transition-colors hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          {ticket.title || 'Untitled ticket'}
        </Link>
      </h3>
      <dl className="mt-4 grid gap-2.5 pl-1 text-xs sm:grid-cols-2">
        {[
          ['PIC', ticket.pic || '—'],
          ['Cut Point', ticket.cutPoint || '—'],
          ['Coordinate', ticket.hasCoordinates ? 'Available' : 'Not recorded'],
          ['Occur', formatDateTime(ticket.occurAt) || '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--surface-muted)] p-2.5">
            <dt className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--text-muted)]">
              {label}
            </dt>
            <dd className="mt-1.5 line-clamp-2 font-semibold leading-5 text-[var(--text-secondary)]">
              {value}
            </dd>
          </div>
        ))}
        <div className="rounded-xl bg-[var(--surface-muted)] p-2.5 sm:col-span-2">
          <dt className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--text-muted)]">
            Latest Progress
          </dt>
          <dd className="mt-1.5 line-clamp-3 font-medium leading-5 text-[var(--text-secondary)]">
            {ticket.latestProgress?.text || 'No progress update yet'}
          </dd>
        </div>
      </dl>
      <div className="mt-4 pl-1">
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
        <Skeleton key={index} className="h-52" />
      ))}
    </div>
  );
}

export function RunningTicketsPage() {
  const { can, localDevelopmentMode } = useAuth();
  const { pushToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [coordinateFilter, setCoordinateFilter] = useState('all');
  const [sort, setSort] = useState('updated-desc');
  const [loading, setLoading] = useState(!localDevelopmentMode);
  const [error, setError] = useState(null);
  const [copyPendingId, setCopyPendingId] = useState(null);
  const [resolvePendingId, setResolvePendingId] = useState(null);
  const canMutate = can(CAPABILITY.EDIT_TICKET);
  const canCreate = can(CAPABILITY.CREATE_TICKET);

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
    <div className="space-y-5 md:space-y-6">
      <section className="spatial-panel-elevated relative overflow-hidden p-5 md:p-7">
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[var(--accent-glow)] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="spatial-kicker">Active incidents</p>
              <StatusBadge status="RUNNING" />
            </div>
            <h2 className="spatial-title mt-3">Running Ticket</h2>
            <p className="spatial-description mt-4">
              Scan the live queue, find the next incident quickly, and keep common operator actions
              within one click without turning the workspace into a dense wall of controls.
            </p>
          </div>
          {canCreate ? (
            <Link to="/generator/new" className={primaryLinkClass}>
              <UiIcon name="plus" size={16} />
              New Ticket
            </Link>
          ) : null}
        </div>
      </section>

      {localDevelopmentMode ? (
        <div className="rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] p-4 text-sm leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
          <span className="font-bold text-[var(--accent-text)]">Local preview.</span> No persisted
          Running Tickets are available until Firebase is configured.
        </div>
      ) : null}

      <section className="grid gap-3 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] lg:grid-cols-[minmax(0,1fr)_220px_220px] lg:items-end lg:p-5">
        <TextInput
          id="running-search"
          label="Search Running Tickets"
          placeholder="TT number, Title, PIC, or Cut Point"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <SelectField
          id="running-coordinate-filter"
          label="Coordinate filter"
          value={coordinateFilter}
          options={COORDINATE_OPTIONS}
          onValueChange={setCoordinateFilter}
        />
        <SelectField
          id="running-sort"
          label="Sort"
          value={sort}
          options={SORT_OPTIONS}
          onValueChange={setSort}
        />
      </section>

      {!loading && !error && tickets.length > 0 ? (
        <div className="flex items-center justify-between gap-3 px-1" aria-live="polite">
          <p className="text-xs font-semibold text-[var(--text-muted)]">
            Showing {visibleTickets.length} of {tickets.length} Running Tickets.
          </p>
          <span className="spatial-chip hidden sm:inline-flex">Live queue</span>
        </div>
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
            tickets.length === 0 && canCreate ? (
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

          <div className="data-table-shell hidden overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-md)] md:block">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead className="bg-[var(--surface-panel-translucent)] text-[10px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-4 font-extrabold">Ticket</th>
                  <th className="px-4 py-4 font-extrabold">Latest Progress</th>
                  <th className="px-4 py-4 font-extrabold">PIC</th>
                  <th className="px-4 py-4 font-extrabold">Cut Point</th>
                  <th className="px-4 py-4 font-extrabold">Coordinate</th>
                  <th className="px-4 py-4 font-extrabold">Updated</th>
                  <th className="px-4 py-4 font-extrabold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-t border-[var(--border-subtle)] align-top transition-colors duration-200 hover:bg-[var(--surface-muted)]"
                  >
                    <td className="max-w-sm px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--success-solid)]"
                          aria-hidden="true"
                        />
                        <p className="font-mono text-[11px] font-bold text-[var(--text-muted)]">
                          {ticket.externalTtNumber ?? 'No TT detected'}
                        </p>
                      </div>
                      <p className="mt-1.5 line-clamp-2 font-bold tracking-[-0.01em]">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="rounded-sm transition-colors hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        >
                          {ticket.title || 'Untitled ticket'}
                        </Link>
                      </p>
                      <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                        Occur {formatDateTime(ticket.occurAt) || '—'}
                      </p>
                    </td>
                    <td className="max-w-xs px-4 py-4 font-medium text-[var(--text-secondary)]">
                      <p className="line-clamp-3 leading-6">{ticket.latestProgress?.text || '—'}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--text-secondary)]">
                      {ticket.pic || '—'}
                    </td>
                    <td className="max-w-xs px-4 py-4 font-medium text-[var(--text-secondary)]">
                      <p className="line-clamp-3 leading-6">{ticket.cutPoint || '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                      {ticket.hasCoordinates ? 'Available' : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-[var(--text-muted)]">
                      {formatDateTime(ticket.updatedAt) || '—'}
                    </td>
                    <td className="px-4 py-4">
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
