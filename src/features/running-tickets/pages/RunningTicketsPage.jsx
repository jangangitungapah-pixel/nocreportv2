import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PageHeader } from '../../../app/components/PageHeader.jsx';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import {
  TICKET_STATUS,
  formatDateTime,
  formatTicketReport,
} from '../../../entities/ticket/index.js';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { DataTable, RowActionsMenu } from '../../../shared/data-workspace/index.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { ErrorState, SelectField, StatusBadge } from '../../../shared/ui/index.jsx';

const MAX_REPORT_PROGRESS = 1000;

const COORDINATE_OPTIONS = [
  { value: 'all', label: 'All Running' },
  { value: 'with', label: 'With coordinates' },
  { value: 'without', label: 'Without coordinates' },
];

function matchesCoordinateFilter(ticket, filter) {
  if (filter === 'with') return Boolean(ticket.hasCoordinates);
  if (filter === 'without') return !ticket.hasCoordinates;
  return true;
}

function dateMillis(value) {
  if (!(value instanceof Date)) return Number.NEGATIVE_INFINITY;
  return Number.isNaN(value.getTime()) ? Number.NEGATIVE_INFINITY : value.getTime();
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

function RunningMobileRow({ row, getActions }) {
  const ticket = row.original;

  return (
    <article className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate font-mono text-[10.5px] font-bold text-[var(--text-muted)]">
              {ticket.externalTtNumber ?? 'No TT detected'}
            </p>
            <StatusBadge status={ticket.status} />
          </div>
          <Link
            to={`/tickets/${ticket.id}`}
            className="mt-1.5 block line-clamp-2 rounded-sm text-[13px] font-bold leading-5 tracking-[-0.01em] text-[var(--text-primary)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {ticket.title || 'Untitled ticket'}
          </Link>
        </div>
        <p className="shrink-0 text-[10px] font-semibold text-[var(--text-faint)]">
          {formatDateTime(ticket.updatedAt) || '—'}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[var(--text-muted)]">
        <span>PIC {ticket.pic || '—'}</span>
        <span>Occur {formatDateTime(ticket.occurAt) || '—'}</span>
        <span>{ticket.hasCoordinates ? 'Coordinate available' : 'No coordinate'}</span>
      </div>

      <p className="mt-2 line-clamp-2 text-[11px] leading-4.5 text-[var(--text-secondary)]">
        <span className="font-bold text-[var(--text-muted)]">Latest:</span>{' '}
        {ticket.latestProgress?.text || 'No progress update yet'}
      </p>

      <div className="mt-2 flex items-end justify-between gap-3 border-t border-[var(--border-subtle)] pt-2">
        <p className="line-clamp-1 min-w-0 text-[10.5px] font-medium text-[var(--text-faint)]">
          {ticket.cutPoint || 'Cut Point not recorded'}
        </p>
        <div className="shrink-0 [&_button]:h-11 [&_button]:w-11">
          <RowActionsMenu
            label={`Actions for ${ticket.externalTtNumber ?? ticket.title ?? 'Ticket'}`}
            actions={getActions(ticket)}
          />
        </div>
      </div>
    </article>
  );
}

export function RunningTicketsPage() {
  const { can, localDevelopmentMode } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [coordinateFilter, setCoordinateFilter] = useState('all');
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

  const coordinateFilteredTickets = useMemo(
    () => tickets.filter((ticket) => matchesCoordinateFilter(ticket, coordinateFilter)),
    [coordinateFilter, tickets],
  );

  const copyReport = useCallback(
    async (ticket) => {
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
    },
    [copyPendingId, pushToast],
  );

  const resolveTicket = useCallback(
    async (ticket) => {
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
    },
    [canMutate, loadTickets, pushToast, resolvePendingId],
  );

  const getActions = useCallback(
    (ticket) => {
      const ttLabel = ticket.externalTtNumber ?? ticket.title ?? 'Ticket';
      return [
        {
          key: 'review',
          label: 'Review Ticket',
          icon: 'info',
          onSelect: () => navigate(`/tickets/${ticket.id}`),
        },
        canMutate
          ? {
              key: 'progress',
              label: 'Add Progress',
              icon: 'edit',
              onSelect: () => navigate(`/generator/${ticket.id}/edit#progress-text`),
            }
          : null,
        {
          key: 'copy',
          label: copyPendingId === ticket.id ? 'Copying report…' : 'Copy Report',
          icon: 'copy',
          disabled: Boolean(copyPendingId),
          onSelect: () => copyReport(ticket),
        },
        canMutate
          ? {
              key: 'resolve',
              label: resolvePendingId === ticket.id ? 'Resolving…' : 'Resolve Ticket',
              icon: 'check',
              danger: true,
              separatorBefore: true,
              disabled: Boolean(resolvePendingId),
              onSelect: () => resolveTicket(ticket),
            }
          : null,
      ];
    },
    [canMutate, copyPendingId, copyReport, navigate, resolvePendingId, resolveTicket],
  );

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
        accessorFn: (ticket) => ticket.externalTtNumber ?? '',
        header: 'TT',
        enableHiding: false,
        meta: { label: 'TT', cellClassName: 'whitespace-nowrap' },
        cell: ({ row }) => (
          <Link
            to={`/tickets/${row.original.id}`}
            className="rounded-sm font-mono text-[10.5px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {row.original.externalTtNumber ?? 'No TT detected'}
          </Link>
        ),
      },
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Title',
        enableHiding: false,
        meta: { label: 'Title', headerClassName: 'min-w-[240px]', cellClassName: 'max-w-[360px]' },
        cell: ({ row }) => (
          <Link
            to={`/tickets/${row.original.id}`}
            className="line-clamp-2 rounded-sm text-[12.5px] font-bold leading-5 tracking-[-0.01em] text-[var(--text-primary)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {row.original.title || 'Untitled ticket'}
          </Link>
        ),
      },
      {
        id: 'pic',
        accessorFn: (ticket) => ticket.pic ?? '',
        header: 'PIC',
        meta: { label: 'PIC', cellClassName: 'whitespace-nowrap font-semibold' },
        cell: ({ row }) => row.original.pic || '—',
      },
      {
        id: 'occurAt',
        accessorFn: (ticket) => dateMillis(ticket.occurAt),
        header: 'Occur',
        meta: {
          label: 'Occur',
          cellClassName: 'whitespace-nowrap text-[11px] text-[var(--text-muted)]',
        },
        cell: ({ row }) => formatDateTime(row.original.occurAt) || '—',
      },
      {
        id: 'latestProgress',
        accessorFn: (ticket) => ticket.latestProgress?.text ?? '',
        header: 'Latest Progress',
        meta: {
          label: 'Latest Progress',
          headerClassName: 'min-w-[220px]',
          cellClassName: 'max-w-[320px]',
        },
        cell: ({ row }) => (
          <p className="line-clamp-2 text-[11.5px] leading-4.5 text-[var(--text-secondary)]">
            {row.original.latestProgress?.text || '—'}
          </p>
        ),
      },
      {
        id: 'cutPoint',
        accessorFn: (ticket) => ticket.cutPoint ?? '',
        header: 'Cut Point',
        meta: {
          label: 'Cut Point',
          headerClassName: 'min-w-[180px]',
          cellClassName: 'max-w-[240px]',
        },
        cell: ({ row }) => (
          <div className="flex items-start gap-1.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                row.original.hasCoordinates
                  ? 'bg-[var(--success-solid)]'
                  : 'bg-[var(--border-strong)]'
              }`}
              aria-hidden="true"
            />
            <p className="line-clamp-2 text-[11.5px] leading-4.5 text-[var(--text-secondary)]">
              {row.original.cutPoint ||
                (row.original.hasCoordinates ? 'Coordinate available' : '—')}
            </p>
          </div>
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
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        meta: { label: 'Actions', headerClassName: 'w-12', cellClassName: 'w-12' },
        cell: ({ row }) => (
          <RowActionsMenu
            label={`Actions for ${row.original.externalTtNumber ?? row.original.title ?? 'Ticket'}`}
            actions={getActions(row.original)}
          />
        ),
      },
    ],
    [getActions],
  );

  const emptyTitle = tickets.length === 0 ? 'No running tickets' : 'No tickets match your filters';
  const emptyDescription =
    tickets.length === 0
      ? 'Tickets marked Running will appear here automatically.'
      : 'Try a different TT number, title, PIC, Cut Point, search term, or coordinate filter.';

  return (
    <div className="grid gap-3">
      <PageHeader
        title="Running Tickets"
        eyebrow="Live queue"
        description={
          localDevelopmentMode
            ? 'Local preview has no persisted Running Tickets.'
            : `${tickets.length} active incident${tickets.length === 1 ? '' : 's'} loaded from the bounded queue.`
        }
        actions={
          canCreate ? (
            <Button asChild tone="primary" size="sm">
              <Link to="/generator/new">
                <AppIcon name="plus" size={14} />
                New Ticket
              </Link>
            </Button>
          ) : null
        }
      />

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

      {!error ? (
        <DataTable
          ariaLabel="Running Tickets workspace"
          data={coordinateFilteredTickets}
          columns={columns}
          getRowId={(ticket) => ticket.id}
          loading={loading}
          searchLabel="Search Running Tickets"
          searchPlaceholder="TT, title, PIC, progress, or Cut Point"
          rowDensity="two-line"
          storageKey="running-tickets-display-v1"
          initialState={{ sorting: [{ id: 'updatedAt', desc: true }] }}
          minWidth={1120}
          toolbar={
            <div className="w-full sm:w-44">
              <SelectField
                id="running-coordinate-filter"
                label="Coordinate filter"
                value={coordinateFilter}
                options={COORDINATE_OPTIONS}
                onValueChange={setCoordinateFilter}
              />
            </div>
          }
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          emptyAction={
            tickets.length === 0 && canCreate ? (
              <Button asChild tone="primary" size="sm">
                <Link to="/generator/new">Create Ticket</Link>
              </Button>
            ) : null
          }
          mobileRow={(props) => <RunningMobileRow {...props} getActions={getActions} />}
        />
      ) : null}
    </div>
  );
}
