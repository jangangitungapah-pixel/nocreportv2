import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../app/components/PageHeader.jsx';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import { TICKET_STATUS, formatDateTime } from '../../../entities/ticket/index.js';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { DataTable } from '../../../shared/data-workspace/index.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../shared/ui/primitives.jsx';
import { ConfirmDialog, ErrorState, StatusBadge } from '../../../shared/ui/index.jsx';

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

function dateMillis(value) {
  if (!(value instanceof Date)) return Number.NEGATIVE_INFINITY;
  return Number.isNaN(value.getTime()) ? Number.NEGATIVE_INFINITY : value.getTime();
}

function ArchiveAction({ ticket, mutatingTicketId, onRequestAction, compact = false }) {
  const isArchived = ticket.status === TICKET_STATUS.ARCHIVED;
  const label = isArchived ? 'Restore' : 'Archive';
  const ttLabel = ticket.externalTtNumber || ticket.id;
  const pending = mutatingTicketId === ticket.id;

  return (
    <Button
      type="button"
      tone={isArchived ? 'primary' : 'danger'}
      size={compact ? 'xs' : 'sm'}
      className={compact ? 'min-h-10 md:min-h-8' : undefined}
      disabled={pending}
      aria-label={`${label} ${ttLabel}`}
      onClick={() =>
        onRequestAction({
          ticket,
          action: isArchived ? 'restore' : 'archive',
        })
      }
    >
      <AppIcon name={isArchived ? 'refresh' : 'archive'} size={13} />
      {pending ? 'Working…' : label}
    </Button>
  );
}

function ArchiveMobileRow({ row, mutatingTicketId, onRequestAction }) {
  const ticket = row.original;
  const ttLabel = ticket.externalTtNumber || ticket.id;

  return (
    <article className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <span className="truncate font-mono text-[10px] font-bold text-[var(--text-muted)]">
              {ttLabel}
            </span>
          </div>
          <Link
            to={`/tickets/${ticket.id}`}
            className="mt-1.5 block line-clamp-2 rounded-sm text-[13px] font-bold leading-5 tracking-[-0.01em] text-[var(--text-primary)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {ticket.title || 'Untitled Ticket'}
          </Link>
        </div>
        <span className="shrink-0 font-mono text-[9.5px] font-semibold text-[var(--text-faint)]">
          r{ticket.revision}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-medium text-[var(--text-muted)]">
        <span>Updated {formatDateTime(ticket.updatedAt) || '—'}</span>
        <span>{ticket.pic ? `PIC ${ticket.pic}` : 'PIC —'}</span>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-[var(--border-subtle)] pt-2">
        <Button asChild tone="ghost" size="xs" className="min-h-10">
          <Link to={`/tickets/${ticket.id}`}>
            <AppIcon name="info" size={13} />
            Review
          </Link>
        </Button>
        <ArchiveAction
          ticket={ticket}
          mutatingTicketId={mutatingTicketId}
          onRequestAction={onRequestAction}
          compact
        />
      </div>
    </article>
  );
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

  const columns = useMemo(
    () => [
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        meta: { label: 'Status' },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'tt',
        accessorFn: (ticket) => ticket.externalTtNumber ?? ticket.id,
        header: 'TT',
        enableHiding: false,
        meta: { label: 'TT', cellClassName: 'whitespace-nowrap' },
        cell: ({ row }) => (
          <Link
            to={`/tickets/${row.original.id}`}
            className="rounded-sm font-mono text-[10.5px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {row.original.externalTtNumber || row.original.id}
          </Link>
        ),
      },
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Incident',
        enableHiding: false,
        meta: {
          label: 'Incident',
          headerClassName: 'min-w-[300px]',
          cellClassName: 'max-w-[520px]',
        },
        cell: ({ row }) => (
          <Link
            to={`/tickets/${row.original.id}`}
            className="line-clamp-2 rounded-sm text-[12.5px] font-bold leading-5 tracking-[-0.01em] text-[var(--text-primary)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {row.original.title || 'Untitled Ticket'}
          </Link>
        ),
      },
      {
        id: 'updatedAt',
        accessorFn: (ticket) => dateMillis(ticket.updatedAt),
        header: 'Updated',
        meta: {
          label: 'Updated',
          cellClassName: 'whitespace-nowrap text-[11px] text-[var(--text-muted)]',
        },
        cell: ({ row }) => formatDateTime(row.original.updatedAt) || '—',
      },
      {
        id: 'revision',
        accessorKey: 'revision',
        header: 'Revision',
        meta: {
          label: 'Revision',
          headerClassName: 'w-24',
          cellClassName: 'w-24 font-mono text-[10.5px] text-[var(--text-muted)]',
        },
        cell: ({ row }) => `r${row.original.revision}`,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableHiding: false,
        meta: { label: 'Actions', headerClassName: 'w-[190px]', cellClassName: 'w-[190px]' },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button asChild tone="ghost" size="xs">
              <Link to={`/tickets/${row.original.id}`}>
                <AppIcon name="info" size={13} />
                Review
              </Link>
            </Button>
            <ArchiveAction
              ticket={row.original}
              mutatingTicketId={mutatingTicketId}
              onRequestAction={setPendingAction}
              compact
            />
          </div>
        ),
      },
    ],
    [mutatingTicketId],
  );

  if (!canArchiveRestore) {
    return (
      <ErrorState
        title="Admin access required"
        description="Archive and Restore actions are restricted to Admin accounts."
      />
    );
  }

  const currentLabel = view === VIEW.ARCHIVED ? 'Archived' : 'Resolved';
  const emptyTitle =
    view === VIEW.ARCHIVED
      ? 'No archived Tickets in this page set'
      : 'No resolved Tickets to archive';
  const emptyDescription =
    view === VIEW.ARCHIVED
      ? 'Archived Tickets will appear here while they remain in lifecycle history.'
      : 'Tickets become eligible here after they are marked Resolved.';

  const workspace = (
    <>
      {localDevelopmentMode ? (
        <div className="border-l-2 border-[var(--accent-solid)] bg-[var(--accent-soft)] px-3 py-2 text-[10.5px] leading-5 text-[var(--text-secondary)]">
          <span className="font-extrabold text-[var(--accent-text)]">Local preview.</span> Archive
          data is unavailable because lifecycle mutations require Firebase Auth and Firestore.
        </div>
      ) : null}

      {!localDevelopmentMode && error ? (
        <ErrorState
          title="Archive list could not be loaded"
          description="Check the Firebase connection and retry this bounded Ticket query."
          onRetry={loadInitial}
        />
      ) : null}

      {!localDevelopmentMode && !error ? (
        <DataTable
          ariaLabel={`${currentLabel} lifecycle Tickets workspace`}
          data={tickets}
          columns={columns}
          getRowId={(ticket) => ticket.id}
          loading={loading}
          searchLabel={`Search ${currentLabel} Tickets`}
          searchPlaceholder="TT or incident title"
          rowDensity="compact"
          initialState={{ sorting: [{ id: 'updatedAt', desc: true }] }}
          minWidth={920}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          mobileRow={(props) => (
            <ArchiveMobileRow
              {...props}
              mutatingTicketId={mutatingTicketId}
              onRequestAction={setPendingAction}
            />
          )}
        />
      ) : null}

      {!localDevelopmentMode && !loading && !error && hasMore ? (
        <div className="flex items-center justify-center border-t border-[var(--border-subtle)] pt-3">
          <Button tone="secondary" size="sm" disabled={loadingMore} onClick={loadMore}>
            <AppIcon name="plus" size={13} />
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="grid gap-3">
      <PageHeader
        title="Archive & Restore"
        eyebrow="Admin lifecycle controls"
        description="Revision-safe historical Ticket lifecycle management."
      />

      <div
        className="flex min-h-9 flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-2"
        role="group"
        aria-label="Archive workspace summary"
      >
        <span className="inline-flex min-h-6 items-center rounded-full border border-[var(--border-accent)] bg-[var(--accent-soft)] px-2.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--accent-text)]">
          Admin only
        </span>
        <span className="text-[10px] font-semibold text-[var(--text-muted)]">
          <strong className="font-mono text-[var(--text-primary)]">{tickets.length}</strong> loaded
        </span>
        <span className="text-[10px] font-semibold text-[var(--text-muted)]">25 / page</span>
        <span className="ml-auto hidden text-[10px] font-medium text-[var(--text-faint)] sm:inline">
          {currentLabel} lifecycle view · bounded cursor pagination
        </span>
      </div>

      <Tabs value={view} onValueChange={setView} className="grid gap-3">
        <TabsList aria-label="Archive view">
          <TabsTrigger value={VIEW.RESOLVED}>Resolved</TabsTrigger>
          <TabsTrigger value={VIEW.ARCHIVED}>Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={VIEW.RESOLVED} forceMount className="mt-0 data-[state=inactive]:hidden">
          {view === VIEW.RESOLVED ? workspace : null}
        </TabsContent>
        <TabsContent value={VIEW.ARCHIVED} forceMount className="mt-0 data-[state=inactive]:hidden">
          {view === VIEW.ARCHIVED ? workspace : null}
        </TabsContent>
      </Tabs>

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
