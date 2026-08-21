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
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]" aria-label="Loading Ticket">
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

  const coordinate = ticket.hasCoordinates && ticket.coordinate
    ? formatCoordinatePair(ticket.coordinate.latitude, ticket.coordinate.longitude)
    : '—';

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-text)]">
        <p className="font-semibold">Viewer read-only mode</p>
        <p className="mt-1 text-xs leading-5">
          You can inspect this Ticket and copy the generated report. Ticket, progress, lifecycle, and coordinate mutations are disabled for the Viewer role.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
        <div className="space-y-5">
          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-[var(--text-muted)]">
                  {ticket.externalTtNumber || 'No TT detected'}
                </p>
                <h2 className="mt-2 break-words text-lg font-bold">{ticket.title || 'Untitled Ticket'}</h2>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            <dl className="mt-6 grid gap-5 md:grid-cols-2">
              <Detail label="Occur Time" value={formatDateTime(ticket.occurAt)} />
              <Detail label="Dispatch Time" value={formatDateTime(ticket.dispatchAt)} />
              <Detail label="PIC" value={ticket.pic} />
              <Detail label="Rootcause" value={ticket.rootcause} />
              <Detail label="Cut Point" value={ticket.cutPoint} />
              <Detail label="Coordinate" value={coordinate} />
            </dl>
          </section>

          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">Progress Timeline</h3>
              <span className="text-xs text-[var(--text-muted)]">{progress.length} update(s)</span>
            </div>
            {progress.length ? (
              <ol className="mt-4 space-y-3">
                {progress.map((entry) => (
                  <li key={entry.id} className="rounded-lg bg-[var(--surface-muted)] p-3">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                      {formatDateTime(entry.occurredAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
                      {entry.text}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-muted)]">No progress update recorded.</p>
            )}
          </section>
        </div>

        <ReportPreview report={report} onCopy={copyReport} copyPending={copyPending} />
      </div>
    </div>
  );
}
