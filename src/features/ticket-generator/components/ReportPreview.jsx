import { cn } from '../../../shared/lib/cn.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button, ScrollArea } from '../../../shared/ui/primitives.jsx';

function focusValidationField(field) {
  if (typeof document === 'undefined') return;
  const fieldIds = {
    title: 'ticket-title',
    occurAt: 'occur-at',
    dispatchAt: 'dispatch-at',
    closedAt: 'closed-at',
    pic: 'pic',
    rootcause: 'rootcause',
    cutPoint: 'cut-point',
    latitude: 'latitude',
    longitude: 'longitude',
    progress: 'progress-text',
  };
  const target = fieldIds[field] ? document.getElementById(fieldIds[field]) : null;
  if (target) {
    target.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    target.focus?.();
    return;
  }
  if (field === 'impactList') {
    document
      .querySelector('.generator-impact-editor')
      ?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }
}

function deriveCopilot(validation) {
  const findings = validation?.findings ?? [];
  const blocking = findings.find((item) => item.severity === 'blocking') ?? null;
  const warning = findings.find((item) => item.severity === 'warning') ?? null;

  if (blocking?.source === 'import') {
    return {
      stage: '01 · Intake',
      label: 'Next required',
      detail: blocking.message,
      field: blocking.field,
    };
  }

  if (blocking) {
    return {
      stage: '02 · Define the incident',
      label: 'Next required',
      detail: blocking.message,
      field: blocking.field,
    };
  }

  if (warning) {
    return {
      stage: '04 · Review & handover',
      label: 'Review next',
      detail: warning.message,
      field: warning.field,
    };
  }

  return {
    stage: '04 · Review & handover',
    label: 'Next step',
    detail: 'Required fields are ready. Review the canonical report before lifecycle action.',
    field: null,
  };
}

export function ReportPreview({
  report,
  validation,
  onCopy,
  copyPending = false,
  className,
  fill = false,
  showCopyAction = true,
  title = 'Report Preview',
}) {
  const copilot = deriveCopilot(validation);

  return (
    <aside
      id="generator-report-preview"
      tabIndex={-1}
      className={cn(
        'generator-report-preview min-w-0',
        fill ? 'h-full min-h-0' : 'xl:sticky xl:top-20 xl:self-start',
        className,
      )}
    >
      <section className="generator-output-surface generator-report-preview__surface flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
        <div className="generator-output-header generator-report-preview__header flex min-h-10 shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-3">
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-faint)]">
              Live output
            </p>
            <h3 className="truncate text-xs font-bold text-[var(--text-primary)]">{title}</h3>
          </div>
          {showCopyAction ? (
            <Button tone="secondary" size="sm" onClick={onCopy} disabled={copyPending}>
              <AppIcon name="copy" size={14} />
              {copyPending ? 'Copying…' : 'Copy Report'}
            </Button>
          ) : null}
        </div>
        {validation ? (
          <div
            className="generator-preview-readiness"
            data-state={validation.readyForRunning ? 'ready' : 'blocked'}
          >
            <span className="generator-preview-readiness__signal" aria-hidden="true" />
            <div className="min-w-0">
              <strong>
                {validation.readyForRunning
                  ? 'Ready for Running'
                  : `${validation.counts.blocking} required issue${validation.counts.blocking === 1 ? '' : 's'}`}
              </strong>
              <span>
                {validation.counts.warning} warning{validation.counts.warning === 1 ? '' : 's'} ·{' '}
                {validation.counts.info} note{validation.counts.info === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ) : null}
        <div className="generator-report-preview__stage min-h-0 flex-1 bg-[var(--surface-muted)] p-1.5 xl:bg-[var(--surface-panel)] xl:p-0">
          <ScrollArea
            className={cn(
              'generator-report-preview__document rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] xl:rounded-none xl:border-0 xl:shadow-none',
              fill ? 'h-full min-h-0' : 'max-h-[calc(100vh-8.5rem)] min-h-72',
            )}
          >
            <pre
              className="generator-report-preview__content min-h-full whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-5 text-[var(--text-primary)] xl:p-4"
              aria-label="Generated NOC report"
            >
              {report}
            </pre>
          </ScrollArea>
        </div>
        {validation ? (
          <div className="generator-preview-copilot grid shrink-0 gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-3 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            <div className="generator-preview-copilot__stage grid min-w-0 gap-0.5">
              <span className="text-[8px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
                Current stage
              </span>
              <strong className="truncate text-[9.5px] font-bold text-[var(--accent-text)]">
                {copilot.stage}
              </strong>
            </div>
            <div className="generator-preview-copilot__next grid min-w-0 gap-0.5 sm:border-l sm:border-[var(--border-subtle)] sm:pl-3">
              <span className="text-[8px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
                {copilot.label}
              </span>
              <strong className="truncate text-[9.5px] font-semibold text-[var(--text-secondary)]">
                {copilot.detail}
              </strong>
            </div>
            {copilot.field ? (
              <button
                type="button"
                className="generator-preview-copilot__action inline-flex min-h-8 items-center justify-center gap-1.5 rounded-[var(--radius-control)] px-2.5 text-[9.5px] font-bold text-[var(--accent-text)] transition-colors hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                onClick={() => focusValidationField(copilot.field)}
              >
                Go to field
                <AppIcon name="arrowDown" size={12} className="-rotate-90" />
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </aside>
  );
}
