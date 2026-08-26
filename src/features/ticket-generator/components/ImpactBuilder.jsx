import { useEffect, useMemo, useState } from 'react';

import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { Textarea } from '../../../shared/ui/index.jsx';
import { parseImpactCandidates } from '../lib/impactCandidates.js';

const EMPTY_IMPACT_VALUES = Object.freeze([]);

export function ImpactBuilder({ existing = EMPTY_IMPACT_VALUES, onApply }) {
  const [source, setSource] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const parsed = useMemo(
    () => parseImpactCandidates(source, { existing }),
    [existing, source],
  );

  useEffect(() => {
    setSelectedIds(new Set(parsed.items.map((item) => item.id)));
  }, [parsed]);

  const toggle = (id, checked) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const apply = () => {
    const values = parsed.items
      .filter((item) => selectedIds.has(item.id))
      .map((item) => item.value);
    if (!values.length) return;
    onApply?.(values);
    setSource('');
    setSelectedIds(new Set());
  };

  const skippedCount = parsed.stats.sourceDuplicateCount + parsed.stats.existingDuplicateCount;

  return (
    <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <Textarea
          id="impact-builder-source"
          label="Paste impact / service / node list"
          rows={4}
          value={source}
          placeholder={'1. SITE_A\n- Service B\n• NODE_C'}
          onChange={(event) => setSource(event.target.value)}
        />

        <div className="min-h-[6.5rem] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-extrabold text-[var(--text-primary)]">Impact preview</p>
            <span className="text-[9px] font-bold text-[var(--text-faint)]">
              {parsed.items.length} proposed{skippedCount ? ` · ${skippedCount} duplicate skipped` : ''}
            </span>
          </div>

          {parsed.items.length ? (
            <div className="mt-2 grid max-h-36 gap-1.5 overflow-y-auto">
              {parsed.items.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-[10.5px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                >
                  <input
                    className="mt-0.5"
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(event) => toggle(item.id, event.target.checked)}
                  />
                  <span className="min-w-0 flex-1 break-words">{item.value}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[10px] leading-5 text-[var(--text-muted)]">
              Paste one item per line. Bullets and numbering are normalized locally; nothing is
              applied until you select and confirm it.
            </p>
          )}

          <div className="mt-2 flex justify-end">
            <Button type="button" size="xs" disabled={selectedIds.size === 0} onClick={apply}>
              <AppIcon name="plus" size={13} />
              Apply Impact ({selectedIds.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
