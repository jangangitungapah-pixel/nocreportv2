import { AppIcon } from '../../../shared/ui/icon.jsx';
import { formatOperationalDuration } from '../lib/timeIntelligence.js';

const SEVERITY_META = Object.freeze({
  blocking: { label: 'Blocking', className: 'text-[var(--danger-text)]' },
  warning: { label: 'Warning', className: 'text-[var(--warning-text)]' },
  info: { label: 'Info', className: 'text-[var(--text-muted)]' },
});

function Metric({ label, value }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-faint)]">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-[11px] font-bold text-[var(--text-primary)]">
        {formatOperationalDuration(value)}
      </p>
    </div>
  );
}

export function ValidationCenter({ validation, onFocusField }) {
  const time = validation?.time ?? {};
  const findings = validation?.findings ?? [];
  const ready = Boolean(validation?.readyForRunning);

  return (
    <section className="generator-validation-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <AppIcon name={ready ? 'check' : 'info'} size={14} />
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Validation Center</h3>
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] ${
              ready
                ? 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]'
                : 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
            }`}
          >
            {ready ? 'Running ready' : `${validation?.counts?.blocking ?? 0} blocking`}
          </span>
        </div>
        <p className="text-[9px] font-semibold text-[var(--text-faint)]">
          Derived · {time.timezone ?? 'Asia/Jakarta'} · minute refresh
        </p>
      </header>

      <div className="grid gap-2 border-b border-[var(--border-subtle)] p-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Incident elapsed" value={time.incidentElapsedMs} />
        <Metric label="Dispatch delay" value={time.dispatchDelayMs} />
        <Metric label="Latest Progress age" value={time.latestProgressAgeMs} />
        <Metric label="Resolved duration" value={time.resolvedDurationMs} />
        <Metric label="Latest update age" value={time.latestUpdateAgeMs} />
      </div>

      <div className="p-3">
        {findings.length ? (
          <div className="grid gap-1.5">
            {findings.map((item) => {
              const meta = SEVERITY_META[item.severity] ?? SEVERITY_META.info;
              const interactive = Boolean(item.field && onFocusField);
              const content = (
                <>
                  <span
                    className={`shrink-0 text-[9px] font-extrabold uppercase ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                  <span className="min-w-0 flex-1 text-left text-[10.5px] leading-5 text-[var(--text-secondary)]">
                    {item.message}
                  </span>
                  {interactive ? (
                    <span className="shrink-0 text-[9px] font-bold text-[var(--accent-text)]">
                      Focus
                    </span>
                  ) : null}
                </>
              );

              return interactive ? (
                <button
                  key={item.id}
                  type="button"
                  className="flex min-h-9 w-full items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  onClick={() => onFocusField(item.field)}
                >
                  {content}
                </button>
              ) : (
                <div
                  key={item.id}
                  className="flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5"
                >
                  {content}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[10.5px] leading-5 text-[var(--text-muted)]">
            No derived findings. Field validation and lifecycle rules are currently satisfied.
          </p>
        )}
      </div>
    </section>
  );
}
