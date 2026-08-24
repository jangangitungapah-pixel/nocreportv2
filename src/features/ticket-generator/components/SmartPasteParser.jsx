import { useMemo, useState } from 'react';

import { Button, Textarea, UiIcon } from '../../../shared/ui/index.jsx';
import { parseSmartReport } from '../lib/smartReportParser.js';
import '../styles/generatorWorkspace.css';

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
    <section className="generator-smart-import overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-accent)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 md:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <div>
            <p className="spatial-kicker">Smart import</p>
            <h3 className="mt-0.5 text-sm font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              Paste existing NOC report
            </h3>
          </div>
          <span className="spatial-chip min-h-7 px-2.5 text-[10px]">Local parser · no API</span>
        </div>
        {hasSource ? (
          <Button tone="secondary" onClick={() => setSource('')}>
            Clear
          </Button>
        ) : null}
      </div>

      <div className="p-3.5 md:p-4">
        <Textarea
          id="smart-report-paste"
          label="Existing report"
          rows={6}
          value={source}
          placeholder={`*[MANDAU] LINK DOWN ... [TT : INC-...]*\nOccur Time = 25/08/2026 01:10\nDispatch Time = 25/08/2026 01:20\nPIC = ...\nRootcause = ...\nCut Point = ...\n\nUpdate Progress\n01:21 team coordination...`}
          onChange={(event) => setSource(event.target.value)}
        />

        {hasSource ? (
          <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {parsed.stats.fieldCount} fields · {parsed.stats.impactCount} impacts ·{' '}
                  {parsed.stats.progressCount} progress updates
                </p>
                {parsed.detectedFields.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Detected report fields">
                    {parsed.detectedFields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2 py-1 text-[10px] font-bold text-[var(--text-secondary)]"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--success-solid)]"
                          aria-hidden="true"
                        />
                        {FIELD_LABELS[field] ?? field}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    No known labels detected yet.
                  </p>
                )}
              </div>
              <Button disabled={!parsed.canApply} onClick={apply}>
                <UiIcon name="generator" size={16} />
                Fill generator
              </Button>
            </div>

            {parsed.warnings.length > 0 ? (
              <div
                className="mt-3 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-soft)] px-3 py-2 text-xs leading-5 text-[var(--warning-text)]"
                role="status"
              >
                <span className="font-bold">Check before applying:</span>{' '}
                {parsed.warnings.join(' · ')}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
            Paste a completed report here. Fields are previewed first and only applied when you
            choose Fill generator.
          </p>
        )}
      </div>
    </section>
  );
}
