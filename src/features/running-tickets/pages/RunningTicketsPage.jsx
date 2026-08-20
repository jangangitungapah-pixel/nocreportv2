import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { formatDateTime } from '../../../entities/ticket/index.js';
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

function matchesSearch(ticket, search) {
  if (!search) return true;
  const haystack = [ticket.externalTtNumber, ticket.title, ticket.pic, ticket.cutPoint]
    .filter(Boolean)
    .join('\n')
    .toLocaleLowerCase();
  return haystack.includes(search.toLocaleLowerCase());
}

function TicketCard({ ticket }) {
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
        <div className="sm:col-span-2">
          <dt className="font-semibold text-[var(--text-muted)]">Latest Progress</dt>
          <dd className="mt-1 text-[var(--text-secondary)]">
            {ticket.latestProgress?.text || 'No progress update yet'}
          </dd>
        </div>
      </dl>
      <Link to={`/generator/${ticket.id}`} className={`mt-4 w-full ${primaryLinkClass}`}>
        Open Ticket
      </Link>
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
  const { localDevelopmentMode } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(!localDevelopmentMode);
  const [error, setError] = useState(null);

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

  const visibleTickets = useMemo(
    () => tickets.filter((ticket) => matchesSearch(ticket, search.trim())),
    [search, tickets],
  );

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

      <div className="max-w-xl">
        <TextInput
          id="running-search"
          label="Search Running Tickets"
          placeholder="TT number, Title, PIC, or Cut Point"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

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
          title={tickets.length === 0 ? 'No running tickets' : 'No tickets match your search'}
          description={
            tickets.length === 0
              ? 'Tickets marked Running will appear here automatically.'
              : 'Try a different TT number, Title, PIC, or Cut Point.'
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
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)] md:block">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ticket</th>
                  <th className="px-4 py-3 font-semibold">Latest Progress</th>
                  <th className="px-4 py-3 font-semibold">PIC</th>
                  <th className="px-4 py-3 font-semibold">Cut Point</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
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
                    </td>
                    <td className="max-w-xs px-4 py-3 text-[var(--text-secondary)]">
                      <p className="line-clamp-3">{ticket.latestProgress?.text || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{ticket.pic || '—'}</td>
                    <td className="max-w-xs px-4 py-3 text-[var(--text-secondary)]">
                      <p className="line-clamp-3">{ticket.cutPoint || '—'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
                      {formatDateTime(ticket.updatedAt) || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/generator/${ticket.id}`}
                        className="font-semibold text-[var(--accent-text)] hover:underline"
                      >
                        Open
                      </Link>
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
