import { Button } from '../../../shared/ui/index.jsx';

export function ReportPreview({ report, onCopy, copyPending = false }) {
  return (
    <aside className="xl:sticky xl:top-24 xl:self-start">
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-md)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-4 py-4 md:px-5">
          <div>
            <p className="spatial-kicker">Canonical output</p>
            <h3 className="mt-1.5 text-base font-bold">Live Report Preview</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Exact plain text used by Copy Report.
            </p>
          </div>
          <Button onClick={onCopy} disabled={copyPending}>
            <span aria-hidden="true">⧉</span>
            {copyPending ? 'Copying…' : 'Copy Report'}
          </Button>
        </div>
        <div className="relative bg-[var(--surface-muted)] p-2">
          <div
            className="pointer-events-none absolute inset-x-10 top-0 h-16 bg-[radial-gradient(circle_at_top,var(--accent-glow),transparent_68%)] opacity-60"
            aria-hidden="true"
          />
          <pre
            className="relative max-h-[calc(100vh-11rem)] min-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 font-mono text-[12px] leading-6 text-[var(--text-primary)] shadow-[var(--shadow-xs)] md:p-5 md:text-[13px]"
            aria-label="Generated NOC report"
          >
            {report}
          </pre>
        </div>
      </section>
    </aside>
  );
}
