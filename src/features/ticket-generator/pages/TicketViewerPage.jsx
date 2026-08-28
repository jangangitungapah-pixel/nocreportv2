import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { PageHeader } from '../../../app/components/PageHeader.jsx';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import {
  TICKET_STATUS,
  formatCoordinatePair,
  formatDateTime,
  formatTicketReport,
} from '../../../entities/ticket/index.js';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { ErrorState, Skeleton, StatusBadge } from '../../../shared/ui/index.jsx';
import { ReportPreview } from '../components/ReportPreview.jsx';
import { loadTicketEditor } from '../lib/persistenceService.js';

function DetailItem({ label, value }) {
  return (
    <div className="border-t border-[var(--border-subtle)] py-3 first:border-t-0 md:first:border-t">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-[13px] font-semibold leading-5 text-[var(--text-secondary)]">
        {value || '—'}
      </dd>
    </div>
  );
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

export function TicketViewerPage() {
  const { ticketId } = useParams();
  const { can } = useAuth();
  const { pushToast } = useToast();
  const [ticket, setTicket] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyPending, setCopyPending] = useState(false);
  const canEdit = can(CAPABILITY.EDIT_TICKET);
  const canArchiveRestore = can(CAPABILITY.ARCHIVE_RESTORE);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadTicketEditor(ticketId);
      setTicket(loaded.ticket);
      setProgress(loaded.progress);
    } catch (loadError) {
      setTicket(null);
      setProgress([]);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const report = useMemo(
    () => (ticket ? formatTicketReport({ ...ticket, progress }) : ''),
    [progress, ticket],
  );

  const copyReport = async () => {
    setCopyPending(true);
    try {
      await copyPlainText(report);
      pushToast({
        title: 'Report copied',
        message: 'The persisted Ticket report is ready to paste.',
        tone: 'success',
      });
    } catch {
      pushToast({
        title: 'Copy failed',
        message: 'Your browser did not allow clipboard access.',
        tone: 'error',
      });
    } finally {
      setCopyPending(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-3" role="status" aria-live="polite" aria-label="Loading Ticket">
        <Skeleton className="h-14" />
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <Skeleton className="h-[32rem]" />
          <Skeleton className="h-[32rem]" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <ErrorState
        title="Ticket could not be loaded"
        description="Check the Ticket ID, account permission, or Firebase connection."
        onRetry={loadTicket}
      />
    );
  }

  const coordinate =
    ticket.hasCoordinates && ticket.coordinate
      ? formatCoordinatePair(ticket.coordinate.latitude, ticket.coordinate.longitude)
      : '—';
  const lifecycleHref =
    ticket.status === TICKET_STATUS.RUNNING
      ? '/running'
      : canArchiveRestore &&
          (ticket.status === TICKET_STATUS.RESOLVED || ticket.status === TICKET_STATUS.ARCHIVED)
        ? '/archive'
        : null;
  const lifecycleLabel = ticket.status === TICKET_STATUS.RUNNING ? 'Running Queue' : 'Lifecycle';

  return (
    <div className="grid gap-3">
      <PageHeader
        title={ticket.externalTtNumber || 'Ticket Detail'}
        eyebrow="Read-only inspection"
        description={ticket.title || 'Untitled Ticket'}
        actions={
          <>
            {lifecycleHref ? (
              <Button asChild tone="ghost" size="sm">
                <Link to={lifecycleHref}>
                  <AppIcon name={ticket.status === TICKET_STATUS.RUNNING ? 'running' : 'archive'} size={14} />
                  {lifecycleLabel}
                </Link>
              </Button>
            ) : null}
            {ticket.hasCoordinates ? (
              <Button asChild tone="ghost" size="sm">
                <Link to={`/cut-points?ticket=${encodeURIComponent(ticketId)}`}>
                  <AppIcon name="map" size={14} />
                  Locate
                </Link>
              </Button>
            ) : null}
            <Button tone="secondary" size="sm" onClick={copyReport} disabled={copyPending}>
              <AppIcon name="copy" size={14} />
              {copyPending ? 'Copying…' : 'Copy Report'}
            </Button>
            {canEdit ? (
              <Button asChild tone="primary" size="sm">
                <Link to={`/generator/${ticketId}/edit`}>
                  <AppIcon name="edit" size={14} />
                  Edit Ticket
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div
        className="flex min-h-9 flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-2"
        role="group"
        aria-label="Ticket review metadata"
      >
        <StatusBadge status={ticket.status} />
        <span className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          <AppIcon name="info" size={12} />
          Read only
        </span>
        <span className="font-mono text-[10px] font-semibold text-[var(--text-faint)]">
          Revision {ticket.revision}
        </span>
        <span className="ml-auto hidden text-[10px] font-medium text-[var(--text-faint)] sm:inline">
          Persisted inspection · synchronized operational source
        </span>
      </div>

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="grid min-w-0 content-start gap-3">
          <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  Incident data
                </p>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  Operational context
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-faint)]">8 fields</span>
            </header>
            <dl className="grid px-3 md:grid-cols-2 md:gap-x-5 xl:grid-cols-3">
              <DetailItem label="Occur Time" value={formatDateTime(ticket.occurAt)} />
              <DetailItem label="Dispatch Time" value={formatDateTime(ticket.dispatchAt)} />
              <DetailItem label="Closed Time" value={formatDateTime(ticket.closedAt)} />
              <DetailItem label="PIC" value={ticket.pic} />
              <DetailItem label="Rootcause" value={ticket.rootcause} />
              <DetailItem label="Cut Point" value={ticket.cutPoint} />
              <DetailItem label="Coordinate" value={coordinate} />
              <DetailItem label="Resolved Time" value={formatDateTime(ticket.resolvedAt)} />
            </dl>
          </section>

          <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  Incident history
                </p>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">Progress Timeline</h3>
              </div>
              <span className="font-mono text-[10px] font-semibold text-[var(--text-faint)]">
                {progress.length} update{progress.length === 1 ? '' : 's'}
              </span>
            </header>

            {progress.length ? (
              <ol className="divide-y divide-[var(--border-subtle)]">
                {progress.map((entry, index) => (
                  <li
                    key={entry.id}
                    className="grid grid-cols-[32px_minmax(0,1fr)] gap-2.5 px-3 py-2.5"
                  >
                    <span
                      className="mt-0.5 grid h-7 w-7 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] font-mono text-[9px] font-black text-[var(--accent-text)]"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <time className="font-mono text-[10px] font-bold text-[var(--text-faint)]">
                        {formatDateTime(entry.occurredAt)}
                      </time>
                      <p className="mt-0.5 whitespace-pre-wrap text-[13px] font-medium leading-5 text-[var(--text-secondary)]">
                        {entry.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-3 py-5 text-center text-xs font-medium text-[var(--text-muted)]">
                No progress update recorded.
              </p>
            )}
          </section>
        </div>

        <ReportPreview
          report={report}
          onCopy={copyReport}
          copyPending={copyPending}
          showCopyAction={false}
        />
      </div>
    </div>
  );
}
