import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import { TICKET_STATUS, formatDateTime } from '../../../entities/ticket/index.js';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Skeleton,
  StatusBadge,
} from '../../../shared/ui/index.jsx';

const PAGE_SIZE = 25;
const VIEW = Object.freeze({
  RESOLVED: 'resolved',
  ARCHIVED: 'archived',
});

const openLinkClass =
  'inline-flex min-h-[var(--control-height)] items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 text-sm font-bold text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:bg-[var(--surface-panel-strong)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';

function viewStatus(view) {
  return view === VIEW.ARCHIVED ? TICKET_STATUS.ARCHIVED : TICKET_STATUS.RESOLVED;
}

function actionLabel(action) {
  return action === 'restore' ? 'Restore' : 'Archive';
}

export function ArchiveManagementPage() {
  const { can, localDevelopmentMode } = useAuth();
  const { pushToast } = useToast();
  const [view, setView] = useState(VIEW.RESOLVED);
  const [tickets, setTickets] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [mutatingTicketId, setMutatingTicketId] = useState(null);
  const canArchiveRestore = can(CAPABILITY.ARCHIVE_RESTORE);

  const loadInitial = useCallback(async () => {
    if (!canArchiveRestore || localDevelopmentMode) {
      setTickets([]);
      setNextCursor(null);
      setHasMore(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const page = await firestoreTicketRepository.listTickets({
        statuses: [viewStatus(view)],
        limit: PAGE_SIZE,
      });
      setTickets(page.items);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (loadError) {
      setTickets([]);
      setNextCursor(null);
      setHasMore(false);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [canArchiveRestore, localDevelopmentMode, view]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = async () => {
    if (!hasMore || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await firestoreTicketRepository.listTickets({
        statuses: [viewStatus(view)],
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      setTickets((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      pushToast({
        title: 'Could not load more Tickets',
        message: 'Retry the archive list when the Firebase connection is available.',
        tone: 'error',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const confirmLifecycleAction = async () => {
    const request = pendingAction;
    setPendingAction(null);
    if (!request || mutatingTicketId) return;

    setMutatingTicketId(request.ticket.id);
    try {
      if (request.action === 'restore') {
        await firestoreTicketRepository.restoreTicket({
          ticketId: request.ticket.id,
          expectedRevision: request.ticket.revision,
          toStatus: TICKET_STATUS.RESOLVED,
        });
      } else {
        await firestoreTicketRepository.archiveTicket({
          ticketId: request.ticket.id,
          expectedRevision: request.ticket.revision,
        });
      }

      setTickets((current) => current.filter((ticket) => ticket.id !== request.ticket.id));
      pushToast({
        title: request.action === 'restore' ? 'Ticket restored' : 'Ticket archived',
        message:
          request.action === 'restore'
            ? 'The Ticket is operational again as Resolved.'
            : 'The Ticket moved out of normal operational views.',
        tone: 'success',
      });
    } catch (mutationError) {
      pushToast({
        title: `${actionLabel(request.action)} failed`,
        message:
          mutationError?.code === 'STALE_REVISION'
            ? 'This Ticket changed in another session. The list will be refreshed.'
            : 'The lifecycle change could not be persisted. Check permission or Firebase connectivity.',
        tone: 'error',
      });
      await loadInitial();
    } finally {
      setMutatingTicketId(null);
    }
  };

  if (!canArchiveRestore) {
    return (
      <ErrorState
        title="Admin access required"
        description="Archive and Restore actions are restricted to Admin accounts."
      />
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="spatial-panel-elevated relative overflow-hidden p-5 md:p-7">
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[var(--accent-glow)] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="spatial-kicker">Admin lifecycle controls</p>
              <span className="spatial-chip">ADMIN only</span>
            </div>
            <h2 className="spatial-title mt-3">Archive & Restore</h2>
            <p className="spatial-description mt-4">
              Move resolved Tickets out of the daily operational surface without losing history, or
              restore archived work safely. Revision checks and Firestore Security Rules stay in the
              loop for every mutation.
            </p>
          </div>

          <div
            className="flex rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1 shadow-[var(--shadow-xs)]"
            role="group"
            aria-label="Archive view"
          >
            <Button
              tone={view === VIEW.RESOLVED ? 'primary' : 'secondary'}
              className="min-h-10 px-3.5"
              onClick={() => setView(VIEW.RESOLVED)}
            >
              Resolved
            </Button>
            <Button
              tone={view === VIEW.ARCHIVED ? 'primary' : 'secondary'}
              className="min-h-10 px-3.5"
              onClick={() => setView(VIEW.ARCHIVED)}
            >
              Archived
            </Button>
          </div>
        </div>
      </section>

      {localDevelopmentMode ? (
        <section className="rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] p-4 text-sm leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
          <span className="font-bold text-[var(--accent-text)]">Local preview.</span> Archive data
          is unavailable because lifecycle mutations require Firebase Auth and Firestore.
        </section>
      ) : loading ? (
        <div className="space-y-3" aria-label="Loading archive Tickets">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : error ? (
        <ErrorState
          title="Archive list could not be loaded"
          description="Check the Firebase connection and retry this bounded Ticket query."
          onRetry={loadInitial}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-4 py-4 md:px-5">
            <div>
              <p className="spatial-kicker">Lifecycle history</p>
              <h3 className="mt-1.5 text-lg font-bold">
                {view === VIEW.ARCHIVED ? 'Archived Tickets' : 'Resolved Tickets'}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Bounded pages keep historical reads intentional.
              </p>
            </div>
            <span className="spatial-chip">
              {tickets.length} loaded · max {PAGE_SIZE}/page
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
              <span
                className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[var(--surface-muted)] text-xs font-black text-[var(--text-muted)]"
                aria-hidden="true"
              >
                0
              </span>
              <p className="mt-3 font-semibold">
                {view === VIEW.ARCHIVED
                  ? 'No archived Tickets in this page set.'
                  : 'No resolved Tickets are ready to archive.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {tickets.map((ticket) => {
                const isArchived = ticket.status === TICKET_STATUS.ARCHIVED;
                const label = isArchived ? 'Restore' : 'Archive';
                const ttLabel = ticket.externalTtNumber || ticket.id;
                return (
                  <article
                    key={ticket.id}
                    className="group grid gap-4 px-4 py-4 transition-colors duration-200 hover:bg-[var(--surface-muted)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={ticket.status} />
                        <span className="font-mono text-[11px] font-bold text-[var(--text-muted)]">
                          {ttLabel}
                        </span>
                      </div>
                      <p className="mt-2 break-words text-sm font-bold tracking-[-0.01em]">
                        {ticket.title || 'Untitled Ticket'}
                      </p>
                      <p className="mt-1.5 text-xs font-medium text-[var(--text-muted)]">
                        Updated {formatDateTime(ticket.updatedAt)} · revision {ticket.revision}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Link to={`/generator/${ticket.id}`} className={openLinkClass}>
                        Open
                      </Link>
                      <Button
                        tone={isArchived ? 'primary' : 'danger'}
                        disabled={mutatingTicketId === ticket.id}
                        aria-label={`${label} ${ttLabel}`}
                        onClick={() =>
                          setPendingAction({
                            ticket,
                            action: isArchived ? 'restore' : 'archive',
                          })
                        }
                      >
                        {mutatingTicketId === ticket.id ? 'Working…' : label}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {hasMore ? (
            <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-4 text-center">
              <Button tone="secondary" disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.action === 'restore' ? 'Restore Ticket?' : 'Archive Ticket?'}
        description={
          pendingAction?.action === 'restore'
            ? 'This restores the archived Ticket to Resolved so it returns to operational history.'
            : 'This removes the resolved Ticket from normal operational views. It can be restored later by an Admin.'
        }
        confirmLabel={pendingAction?.action === 'restore' ? 'Restore Ticket' : 'Archive Ticket'}
        tone={pendingAction?.action === 'restore' ? 'primary' : 'danger'}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmLifecycleAction}
      />
    </div>
  );
}
