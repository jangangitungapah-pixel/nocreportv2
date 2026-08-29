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
    <section
      className="generator-authoring-surface generator-impact-editor overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] xl:overflow-visible xl:rounded-none xl:border-0 xl:border-t xl:border-t-[var(--border-subtle)] xl:bg-transparent xl:shadow-none"
      aria-labelledby="impact-list-title"
    >
      <header className="generator-impact-header flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3 xl:min-h-0 xl:border-b-0 xl:bg-transparent xl:px-1 xl:pb-2 xl:pt-2.5">
        <div className="min-w-0">
          <div className="flex min-w-0 items-baseline gap-2.5">
            <h3
              id="impact-list-title"
              className="text-xs font-extrabold text-[var(--text-primary)]"
            >
              Impact List
            </h3>
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">
              Optional
            </span>
          </div>
          <p className="mt-0.5 hidden text-[9.5px] font-medium text-[var(--text-muted)] xl:block">
            Paste affected sites or services, then apply only the items that belong to this
            incident.
          </p>
        </div>
        <Button tone="secondary" size="xs" onClick={() => append({ value: '' })}>
          <AppIcon name="plus" size={13} />
          Add impact
        </Button>
      </header>

      <ImpactBuilder existing={currentValues} onApply={onApplyCandidates} />

      {fields.length === 0 ? (
        <p className="generator-impact-empty flex items-center gap-2 px-3 py-3 text-xs font-medium text-[var(--text-muted)] xl:mx-1 xl:border-t xl:border-[var(--border-subtle)] xl:px-0 xl:pb-1 xl:pt-2 xl:text-[10px]">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-faint)] opacity-70"
            aria-hidden="true"
          />
          No impact entries yet. Add only affected sites, services, or nodes.
        </p>
      ) : (
        <div className="generator-impact-list divide-y divide-[var(--border-subtle)] xl:mt-1">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="generator-impact-row grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end xl:pr-1"
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
