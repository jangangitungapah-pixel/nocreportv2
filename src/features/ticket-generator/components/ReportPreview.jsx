import { Button } from '../../../shared/ui/index.jsx';

export function ReportPreview({ report, onCopy, copyPending = false }) {
  return (
    <aside className="xl:sticky xl:top-20 xl:self-start">
      <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <div>
            <h3 className="text-sm font-bold">Live Report Preview</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Exact plain text used by Copy Report.</p>
          </div>
          <Button onClick={onCopy} disabled={copyPending}>
            {copyPending ? 'Copying…' : 'Copy Report'}
          </Button>
        </div>
        <pre
          className="max-h-[calc(100vh-10rem)] min-h-80 overflow-auto whitespace-pre-wrap break-words bg-[var(--surface-muted)] p-4 text-[13px] leading-6 text-[var(--text-primary)]"
          aria-label="Generated NOC report"
        >
          {report}
        </pre>
      </section>
    </aside>
  );
}
