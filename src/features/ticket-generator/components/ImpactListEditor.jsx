import { Button, IconButton, TextInput, UiIcon } from '../../../shared/ui/index.jsx';

export function ImpactListEditor({ fields, register, append, remove, move }) {
  return (
    <section className="generator-impact-editor rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="spatial-kicker">Impact List</p>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-faint)]">
              Optional
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Hidden from the report when empty.
          </p>
        </div>
        <Button tone="secondary" onClick={() => append({ value: '' })}>
          <UiIcon name="plus" size={16} />
          Add impact
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2.5 text-xs font-medium text-[var(--text-muted)]">
          <span
            className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--surface-panel)] text-[10px] font-black shadow-[var(--shadow-xs)]"
            aria-hidden="true"
          >
            0
          </span>
          No impacted service/site recorded.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-2.5 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <TextInput
                id={`impact-${field.id}`}
                label={`Impact ${index + 1}`}
                placeholder="Site, service, or affected item"
                {...register(`impactList.${index}.value`)}
              />
              <div className="flex items-end gap-1">
                <IconButton
                  label={`Move Impact ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <UiIcon name="arrowUp" size={16} />
                </IconButton>
                <IconButton
                  label={`Move Impact ${index + 1} down`}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <UiIcon name="arrowDown" size={16} />
                </IconButton>
                <IconButton label={`Remove Impact ${index + 1}`} onClick={() => remove(index)}>
                  <UiIcon name="close" size={16} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
