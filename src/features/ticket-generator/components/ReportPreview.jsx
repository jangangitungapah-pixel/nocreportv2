import { cn } from '../../../shared/lib/cn.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button, ScrollArea } from '../../../shared/ui/primitives.jsx';

export function ReportPreview({
  report,
  onCopy,
  copyPending = false,
  className,
  fill = false,
  showCopyAction = true,
  title = 'Report Preview',
}) {
  return (
    <aside
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
        <div className="generator-report-preview__stage min-h-0 flex-1 bg-[var(--surface-muted)] p-1.5">
          <ScrollArea
            className={cn(
              'generator-report-preview__document rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)]',
              fill ? 'h-full min-h-0' : 'max-h-[calc(100vh-8.5rem)] min-h-72',
            )}
          >
            <pre
              className="generator-report-preview__content min-h-full whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-5 text-[var(--text-primary)]"
              aria-label="Generated NOC report"
            >
              {report}
            </pre>
          </ScrollArea>
        </div>
      </section>
    </aside>
  );
}
