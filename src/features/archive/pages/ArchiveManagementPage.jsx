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
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Admin lifecycle controls
            </p>
            <h2 className="mt-1 text-xl font-bold">Archive & Restore</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              Archive resolved Tickets out of normal operational views, or restore archived Tickets
              back to Resolved. Every mutation uses the current Ticket revision and is enforced again
              by Firestore Security Rules.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
            ADMIN only
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Archive view">
          <Button
            tone={view === VIEW.RESOLVED ? 'primary' : 'secondary'}
            onClick={() => setView(VIEW.RESOLVED)}
          >
            Resolved
          </Button>
          <Button
            tone={view === VIEW.ARCHIVED ? 'primary' : 'secondary'}
            onClick={() => setView(VIEW.ARCHIVED)}
          >
            Archived
          </Button>
        </div>
      </section>

      {localDevelopmentMode ? (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-sm)]">
          Archive data is unavailable in local preview mode because lifecycle mutations require
          Firebase Auth and Firestore.
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
        <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
            <div>
              <h3 className="text-sm font-bold">
                {view === VIEW.ARCHIVED ? 'Archived Tickets' : 'Resolved Tickets'}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {tickets.length} loaded · pages are bounded to {PAGE_SIZE} Tickets
              </p>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              {view === VIEW.ARCHIVED
                ? 'No archived Tickets in this page set.'
                : 'No resolved Tickets are ready to archive.'}
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
                    className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={ticket.status} />
                        <span className="font-mono text-xs font-semibold text-[var(--text-muted)]">
                          {ttLabel}
                        </span>
                      </div>
                      <p className="mt-2 break-words text-sm font-semibold">
                        {ticket.title || 'Untitled Ticket'}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Updated {formatDateTime(ticket.updatedAt)} · revision {ticket.revision}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button tone="secondary" asChild>
                        <Link to={`/generator/${ticket.id}`}>Open</Link>
                      </Button>
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
            <div className="border-t border-[var(--border-subtle)] p-4 text-center">
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
