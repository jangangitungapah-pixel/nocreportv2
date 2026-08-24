import { Button, UiIcon } from '../../../shared/ui/index.jsx';

export function ReportPreview({ report, onCopy, copyPending = false }) {
  return (
    <aside className="generator-report-preview xl:sticky xl:top-20 xl:self-start">
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-3.5 py-3 md:px-4">
          <div className="min-w-0">
            <p className="spatial-kicker">Live output</p>
            <h3 className="mt-0.5 text-sm font-bold">Report Preview</h3>
          </div>
          <Button onClick={onCopy} disabled={copyPending}>
            <UiIcon name="copy" size={16} />
            {copyPending ? 'Copying…' : 'Copy Report'}
          </Button>
        </div>
        <div className="bg-[var(--surface-muted)] p-2">
          <pre
            className="max-h-[calc(100vh-8.5rem)] min-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-3.5 font-mono text-[12px] leading-5 text-[var(--text-primary)] shadow-[var(--shadow-xs)] md:p-4"
            aria-label="Generated NOC report"
          >
            {report}
          </pre>
        </div>
      </section>
    </aside>
  );
}
