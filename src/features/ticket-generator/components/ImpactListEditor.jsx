import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { TextInput } from '../../../shared/ui/index.jsx';
import { ImpactBuilder } from './ImpactBuilder.jsx';

export function ImpactListEditor({
  fields,
  register,
  append,
  remove,
  move,
  currentValues = [],
  onApplyCandidates,
}) {
  return (
    <section className="generator-authoring-surface generator-impact-editor overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] xl:rounded-none xl:border-0 xl:border-t xl:border-t-[var(--border-subtle)] xl:bg-transparent xl:pt-2 xl:shadow-none">
      <header className="generator-impact-header flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3 xl:min-h-8 xl:border-b-0 xl:px-0 xl:py-1.5">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Impact List</h3>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
            Optional · hidden when empty
          </span>
        </div>
        <Button tone="ghost" size="xs" onClick={() => append({ value: '' })}>
          <AppIcon name="plus" size={13} />
          Add impact
        </Button>
      </header>

      <ImpactBuilder existing={currentValues} onApply={onApplyCandidates} />

      {fields.length === 0 ? (
        <p className="generator-impact-empty px-3 py-3 text-xs font-medium text-[var(--text-muted)] xl:px-0 xl:py-2">
          No impacted service or site recorded.
        </p>
      ) : (
        <div className="generator-impact-list divide-y divide-[var(--border-subtle)]">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="generator-impact-row grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end xl:px-0"
              data-index={index + 1}
            >
              <TextInput
                id={`impact-${field.id}`}
                label={`Impact ${index + 1}`}
                placeholder="Site, service, or affected item"
                {...register(`impactList.${index}.value`)}
              />
              <div className="generator-impact-row-actions flex items-center justify-end gap-1">
                <Button
                  tone="ghost"
                  size="icon"
                  aria-label={`Move Impact ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <AppIcon name="arrowUp" size={14} />
                </Button>
                <Button
                  tone="ghost"
                  size="icon"
                  aria-label={`Move Impact ${index + 1} down`}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <AppIcon name="arrowDown" size={14} />
                </Button>
                <Button
                  tone="ghost"
                  size="icon"
                  aria-label={`Remove Impact ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <AppIcon name="close" size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
