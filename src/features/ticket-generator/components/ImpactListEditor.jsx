import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { TextInput } from '../../../shared/ui/index.jsx';

export function ImpactListEditor({ fields, register, append, remove, move }) {
  return (
    <section className="generator-impact-editor overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
        <div className="flex min-w-0 items-center gap-2">
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

      {fields.length === 0 ? (
        <p className="px-3 py-3 text-xs font-medium text-[var(--text-muted)]">
          No impacted service or site recorded.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
            >
              <TextInput
                id={`impact-${field.id}`}
                label={`Impact ${index + 1}`}
                placeholder="Site, service, or affected item"
                {...register(`impactList.${index}.value`)}
              />
              <div className="flex items-center justify-end gap-1">
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
