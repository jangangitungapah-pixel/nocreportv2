import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useToast } from '../../../app/providers/ToastProvider.jsx';
import {
  formatCoordinatePair,
  formatDateTime,
  formatTicketReport,
} from '../../../entities/ticket/index.js';
import { ErrorState, Skeleton, StatusBadge } from '../../../shared/ui/index.jsx';
import { ReportPreview } from '../components/ReportPreview.jsx';
import { loadTicketEditor } from '../lib/persistenceService.js';

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

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-3.5">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--text-secondary)]">
        {value || '—'}
      </dd>
    </div>
  );
}

export function TicketViewerPage() {
  const { ticketId } = useParams();
  const { pushToast } = useToast();
  const [ticket, setTicket] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyPending, setCopyPending] = useState(false);

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
      <div
        className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]"
        aria-label="Loading Ticket"
      >
        <Skeleton className="h-[34rem]" />
        <Skeleton className="h-[34rem]" />
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

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="spatial-panel-elevated relative overflow-hidden p-5 md:p-6">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--accent-glow)] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="spatial-kicker">Read-only incident view</p>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-3 font-mono text-[11px] font-bold text-[var(--text-muted)]">
              {ticket.externalTtNumber || 'No TT detected'}
            </p>
            <h2 className="mt-2 break-words font-[var(--font-display)] text-2xl font-bold leading-tight tracking-[-0.04em] md:text-3xl">
              {ticket.title || 'Untitled Ticket'}
            </h2>
          </div>
          <span className="spatial-chip">Viewer mode</span>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-text)] shadow-[var(--shadow-xs)]">
        <div className="flex gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-panel)] text-xs font-black shadow-[var(--shadow-xs)]"
            aria-hidden="true"
          >
            R
          </span>
          <div>
            <p className="font-bold">Viewer read-only mode</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              You can inspect this Ticket and copy the generated report. Ticket, progress, lifecycle,
              and coordinate mutations are disabled for the Viewer role.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
        <div className="space-y-5">
          <section className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="spatial-kicker">Incident detail</p>
                <h3 className="mt-1.5 text-base font-bold">Operational context</h3>
              </div>
              <span className="spatial-chip">Revision {ticket.revision}</span>
            </div>

            <dl className="mt-5 grid gap-3 md:grid-cols-2">
              <Detail label="Occur Time" value={formatDateTime(ticket.occurAt)} />
              <Detail label="Dispatch Time" value={formatDateTime(ticket.dispatchAt)} />
              <Detail label="PIC" value={ticket.pic} />
              <Detail label="Rootcause" value={ticket.rootcause} />
              <Detail label="Cut Point" value={ticket.cutPoint} />
              <Detail label="Coordinate" value={coordinate} />
            </dl>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="spatial-kicker">Incident history</p>
                <h3 className="mt-1.5 text-base font-bold">Progress Timeline</h3>
              </div>
              <span className="spatial-chip">{progress.length} update(s)</span>
            </div>
            {progress.length ? (
              <ol className="relative mt-5 space-y-2 before:absolute before:bottom-4 before:left-[18px] before:top-4 before:w-px before:bg-[var(--border-subtle)]">
                {progress.map((entry) => (
                  <li key={entry.id} className="relative grid grid-cols-[38px_minmax(0,1fr)] gap-3">
                    <span
                      className="relative z-10 mt-1 grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[9px] font-black text-[var(--accent-text)] shadow-[var(--shadow-xs)]"
                      aria-hidden="true"
                    >
                      ·
                    </span>
                    <div className="rounded-2xl bg-[var(--surface-muted)] p-3.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--text-muted)]">
                        {formatDateTime(entry.occurredAt)}
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--text-secondary)]">
                        {entry.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 rounded-2xl bg-[var(--surface-muted)] p-4 text-sm font-medium text-[var(--text-muted)]">
                No progress update recorded.
              </p>
            )}
          </section>
        </div>

        <ReportPreview report={report} onCopy={copyReport} copyPending={copyPending} />
      </div>
    </div>
  );
}
