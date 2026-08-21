import { Button, IconButton, TextInput } from '../../../shared/ui/index.jsx';

export function ImpactListEditor({ fields, register, append, remove, move }) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">Impact List</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Optional. The whole section disappears from the generated report when empty.
          </p>
        </div>
        <Button tone="secondary" onClick={() => append({ value: '' })}>
          Add impact
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-secondary)]">
          No impacted service/site recorded.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
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
                  ↑
                </IconButton>
                <IconButton
                  label={`Move Impact ${index + 1} down`}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  ↓
                </IconButton>
                <IconButton label={`Remove Impact ${index + 1}`} onClick={() => remove(index)}>
                  ×
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
