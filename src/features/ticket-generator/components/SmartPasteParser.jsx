import { useMemo, useState } from 'react';

import { Button, Textarea, UiIcon } from '../../../shared/ui/index.jsx';
import { parseSmartReport } from '../lib/smartReportParser.js';

const FIELD_LABELS = {
  title: 'Title',
  impactList: 'Impact',
  occurAt: 'Occur',
  dispatchAt: 'Dispatch',
  pic: 'PIC',
  rootcause: 'Rootcause',
  cutPoint: 'Cut Point',
  progress: 'Progress',
};

export function SmartPasteParser({ onApply }) {
  const [source, setSource] = useState('');
  const parsed = useMemo(() => parseSmartReport(source), [source]);
  const hasSource = Boolean(source.trim());

  const apply = () => {
    if (!parsed.canApply) return;
    onApply(parsed);
  };

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-accent)] bg-[linear-gradient(145deg,var(--surface-panel),var(--accent-soft))] p-4 shadow-[var(--shadow-md)] md:p-5">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--accent-glow)] blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="spatial-kicker">Smart import</p>
              <span className="spatial-chip border-[var(--border-accent)] bg-[var(--surface-panel-translucent)] text-[var(--accent-text)]">
                Local parser · no API
              </span>
            </div>
            <h3 className="mt-2 text-lg font-bold tracking-[-0.025em] text-[var(--text-primary)]">
              Paste an existing NOC report
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-[var(--text-muted)]">
              Paste the complete report and preview what can be detected. Nothing is applied until
              you choose Fill generator.
            </p>
          </div>
          {hasSource ? (
            <Button tone="secondary" onClick={() => setSource('')}>
              Clear
            </Button>
          ) : null}
        </div>

        <div className="mt-4">
          <Textarea
            id="smart-report-paste"
            label="Existing report"
            rows={9}
            value={source}
            placeholder={`*[MANDAU] LINK DOWN ... [TT : INC-...]*\nOccur Time = 25/08/2026 01:10\nDispatch Time = 25/08/2026 01:20\nPIC = ...\nRootcause = ...\nCut Point = ...\n\nUpdate Progress\n01:21 team coordination...`}
            onChange={(event) => setSource(event.target.value)}
          />
        </div>

        {hasSource ? (
          <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-3.5 shadow-[var(--shadow-xs)] backdrop-blur-xl md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Detection preview
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                  {parsed.stats.fieldCount} fields · {parsed.stats.impactCount} impacts ·{' '}
                  {parsed.stats.progressCount} progress updates
                </p>
              </div>
              <Button disabled={!parsed.canApply} onClick={apply}>
                <UiIcon name="generator" size={16} />
                Fill generator
              </Button>
            </div>

            {parsed.detectedFields.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Detected report fields">
                {parsed.detectedFields.map((field) => (
                  <span key={field} className="spatial-chip bg-[var(--surface-panel)]">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[var(--success-solid)]"
                      aria-hidden="true"
                    />
                    {FIELD_LABELS[field] ?? field}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
                No known report labels detected yet. You can still keep editing the pasted text.
              </p>
            )}

            {parsed.values.title ? (
              <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Title preview
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[var(--text-secondary)]">
                  {parsed.values.title}
                </p>
              </div>
            ) : null}

            {parsed.warnings.length > 0 ? (
              <div
                className="mt-3 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-soft)] px-3 py-2.5 text-xs leading-5 text-[var(--warning-text)]"
                role="status"
              >
                <p className="font-bold">Check before applying</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {parsed.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
