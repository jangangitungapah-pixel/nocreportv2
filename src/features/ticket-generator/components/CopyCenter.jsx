import { useMemo } from 'react';

import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { SelectField } from '../../../shared/ui/index.jsx';
import { buildCopyCenterTargets, COPY_TARGET_IDS, COPY_TARGETS } from '../lib/copyCenter.js';

export function CopyCenter({
  ticket,
  validationFindings = [],
  relatedTicketCount = 0,
  selectedTargetId = COPY_TARGET_IDS.FULL_REPORT,
  expanded = true,
  handoverExpanded = false,
  onSelectedTargetChange,
  onExpandedChange,
  onHandoverExpandedChange,
  onCopy,
}) {
  const targets = useMemo(
    () => buildCopyCenterTargets(ticket, { validationFindings, relatedTicketCount }),
    [relatedTicketCount, ticket, validationFindings],
  );
  const selected = targets.find((target) => target.id === selectedTargetId) ?? targets[0];
  const handover = targets.find((target) => target.id === COPY_TARGET_IDS.HANDOVER) ?? null;
  const options = COPY_TARGETS.map((target) => ({ value: target.id, label: target.label }));

  return (
    <section
      id="generator-copy-center"
      className="generator-copy-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
      tabIndex={-1}
    >
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">
        <div className="flex items-center gap-2">
          <AppIcon name="copy" size={14} />
          <div>
            <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Copy Center</h3>
            <p className="text-[9px] font-semibold text-[var(--text-faint)]">
              Canonical operator outputs
            </p>
          </div>
        </div>
        <Button
          type="button"
          tone="ghost"
          size="xs"
          aria-expanded={expanded}
          onClick={() => onExpandedChange?.(!expanded)}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </header>

      {expanded ? (
        <div className="grid gap-3 p-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,0.6fr)_auto] sm:items-end">
            <SelectField
              id="copy-center-target"
              label="Copy target"
              value={selected?.id ?? COPY_TARGET_IDS.FULL_REPORT}
              options={options}
              onValueChange={(value) => onSelectedTargetChange?.(value)}
            />
            <Button
              type="button"
              size="sm"
              disabled={!selected?.available}
              onClick={() => selected?.available && onCopy?.(selected)}
            >
              <AppIcon name="copy" size={14} />
              Copy {selected?.label ?? 'selected'}
            </Button>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-2.5 py-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                Preview
              </span>
              <span className="text-[9px] font-semibold text-[var(--text-faint)]">
                {selected?.available ? `${selected.text.length} chars` : 'No value available'}
              </span>
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words px-2.5 py-2 font-mono text-[10px] leading-5 text-[var(--text-secondary)]">
              {selected?.available ? selected.text : 'Nothing to copy for this target yet.'}
            </pre>
          </div>

          {selected?.id !== COPY_TARGET_IDS.HANDOVER ? (
            <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
              <div className="flex min-h-9 items-center justify-between gap-2 bg-[var(--surface-panel)] px-2.5">
                <div>
                  <p className="text-[10px] font-extrabold text-[var(--text-secondary)]">
                    Shift Handover preview
                  </p>
                  <p className="text-[9px] text-[var(--text-faint)]">Preview / copy only</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    tone="ghost"
                    size="xs"
                    disabled={!handover?.available}
                    onClick={() => handover?.available && onCopy?.(handover)}
                  >
                    Copy handover
                  </Button>
                  <Button
                    type="button"
                    tone="ghost"
                    size="xs"
                    aria-expanded={handoverExpanded}
                    onClick={() => onHandoverExpandedChange?.(!handoverExpanded)}
                  >
                    {handoverExpanded ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>
              {handoverExpanded ? (
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2 font-mono text-[10px] leading-5 text-[var(--text-secondary)]">
                  {handover?.available ? handover.text : 'No handover data available yet.'}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
