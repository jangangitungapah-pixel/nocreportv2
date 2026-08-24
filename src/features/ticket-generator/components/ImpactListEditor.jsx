import { Button, IconButton, TextInput, UiIcon } from '../../../shared/ui/index.jsx';

export function ImpactListEditor({ fields, register, append, remove, move }) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="spatial-kicker">Optional section</p>
          <h3 className="mt-1.5 text-base font-bold">Impact List</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            The whole section disappears from the generated report when empty.
          </p>
        </div>
        <Button tone="secondary" onClick={() => append({ value: '' })}>
          <UiIcon name="plus" size={16} />
          Add impact
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-3.5 text-sm text-[var(--text-secondary)]">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--surface-panel)] text-xs font-black text-[var(--text-muted)] shadow-[var(--shadow-xs)]"
            aria-hidden="true"
          >
            0
          </span>
          No impacted service/site recorded.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
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
