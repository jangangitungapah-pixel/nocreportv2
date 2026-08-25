import { useMemo, useState } from 'react';

import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { Textarea } from '../../../shared/ui/index.jsx';
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
    <section className="generator-smart-import overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-accent)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <AppIcon name="generator" size={14} className="text-[var(--accent-text)]" />
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Smart Import</h3>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
            Local parser · no API
          </span>
        </div>
        {hasSource ? (
          <Button tone="ghost" size="xs" onClick={() => setSource('')}>
            Clear
          </Button>
        ) : null}
      </header>

      <div className="p-3">
        <Textarea
          id="smart-report-paste"
          label="Existing report"
          rows={5}
          value={source}
          placeholder={`*[MANDAU] LINK DOWN ... [TT : INC-...]*\nOccur Time = 25/08/2026 01:10\nDispatch Time = 25/08/2026 01:20\nPIC = ...\nRootcause = ...\nCut Point = ...\n\nUpdate Progress\n01:21 team coordination...`}
          onChange={(event) => setSource(event.target.value)}
        />

        {hasSource ? (
          <div className="mt-2.5 border-t border-[var(--border-subtle)] pt-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[var(--text-primary)]">
                  {parsed.stats.fieldCount} fields · {parsed.stats.impactCount} impacts ·{' '}
                  {parsed.stats.progressCount} progress updates
                </p>
                {parsed.detectedFields.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Detected report fields">
                    {parsed.detectedFields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex min-h-5 items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-1.5 text-[9px] font-bold text-[var(--text-secondary)]"
                      >
                        <span
                          className="h-1 w-1 rounded-full bg-[var(--success-solid)]"
                          aria-hidden="true"
                        />
                        {FIELD_LABELS[field] ?? field}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    No known labels detected yet.
                  </p>
                )}
              </div>
              <Button size="sm" disabled={!parsed.canApply} onClick={apply}>
                <AppIcon name="generator" size={14} />
                Fill generator
              </Button>
            </div>

            {parsed.warnings.length > 0 ? (
              <p
                className="mt-2 border-l-2 border-[var(--warning-solid)] bg-[var(--warning-soft)] px-2.5 py-1.5 text-[10.5px] leading-5 text-[var(--warning-text)]"
                role="status"
              >
                <span className="font-bold">Check before applying:</span>{' '}
                {parsed.warnings.join(' · ')}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1.5 text-[10.5px] leading-5 text-[var(--text-muted)]">
            Detection is preview-only. Nothing is applied until you choose Fill generator.
          </p>
        )}
      </div>
    </section>
  );
}
