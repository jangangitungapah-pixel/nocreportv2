import { Button } from '../../../shared/ui/primitives.jsx';
import { SelectField, TextInput } from '../../../shared/ui/index.jsx';
import { COPY_TARGETS } from '../lib/copyCenter.js';
import { EVENT_TIME_BEHAVIOR } from '../lib/operatorPresets.js';

const PROFILE_OPTIONS = Object.freeze([{ value: 'MANDAU_DEFAULT', label: 'MANDAU Default' }]);
const EVENT_TIME_OPTIONS = Object.freeze([
  { value: EVENT_TIME_BEHAVIOR.NOW, label: 'Default to current time' },
  { value: EVENT_TIME_BEHAVIOR.BLANK, label: 'Start event time blank' },
]);

function UtilityToggle({ label, checked, onChange }) {
  return (
    <label className="generator-preset-toggle flex min-h-9 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function OperatorPresetsPanel({ presets, onChange, onReset, expanded = false }) {
  if (!presets) return null;

  const update = (patch) => onChange?.({ ...presets, ...patch });
  const updateUtility = (key, value) =>
    update({ utilityState: { ...presets.utilityState, [key]: value } });

  return (
    <section
      id="generator-operator-presets"
      className="generator-output-surface generator-operator-presets overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
      tabIndex={-1}
    >
      <header className="generator-output-header generator-operator-presets__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">
        <div>
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Operator Presets</h3>
          <p className="text-[9px] font-semibold text-[var(--text-faint)]">
            Browser-local only · no role or permission state
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold text-[var(--text-faint)]">
            {presets.favoriteProgressSnippetIds.length} favorite snippet
            {presets.favoriteProgressSnippetIds.length === 1 ? '' : 's'}
          </span>
          <Button
            type="button"
            tone="ghost"
            size="xs"
            aria-expanded={expanded}
            onClick={() => updateUtility('presetsExpanded', !expanded)}
          >
            {expanded ? 'Collapse' : 'Configure'}
          </Button>
        </div>
      </header>

      {expanded ? (
        <div className="generator-operator-presets__body grid gap-3 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              id="preset-template-profile"
              label="Default Template Profile"
              value={presets.templateProfileId}
              options={PROFILE_OPTIONS}
              onValueChange={(value) => update({ templateProfileId: value })}
            />
            <TextInput
              id="preset-default-pic"
              label="Default PIC for new Tickets"
              value={presets.defaultPic}
              placeholder="Optional"
              onChange={(event) => update({ defaultPic: event.target.value })}
            />
            <SelectField
              id="preset-copy-target"
              label="Default Copy action"
              value={presets.defaultCopyTarget}
              options={COPY_TARGETS.map((target) => ({ value: target.id, label: target.label }))}
              onValueChange={(value) => update({ defaultCopyTarget: value })}
            />
            <SelectField
              id="preset-event-time"
              label="Progress event-time behavior"
              value={presets.eventTimeBehavior}
              options={EVENT_TIME_OPTIONS}
              onValueChange={(value) => update({ eventTimeBehavior: value })}
            />
          </div>

          <div className="generator-preset-utilities grid gap-2 md:grid-cols-2">
            <UtilityToggle
              label="Copy Center expanded by default"
              checked={presets.utilityState.copyCenterExpanded}
              onChange={(checked) => updateUtility('copyCenterExpanded', checked)}
            />
            <UtilityToggle
              label="Handover preview expanded"
              checked={presets.utilityState.handoverExpanded}
              onChange={(checked) => updateUtility('handoverExpanded', checked)}
            />
          </div>

          <div className="generator-operator-presets__footer flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5">
            <p className="max-w-xl text-[9.5px] leading-5 text-[var(--text-muted)]">
              Favorite Progress snippets stay synchronized with the existing Quick Progress favorite
              control. Presets are applied only as defaults and never overwrite an existing
              persisted Ticket.
            </p>
            <Button type="button" tone="ghost" size="xs" onClick={() => onReset?.()}>
              Reset to defaults
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
