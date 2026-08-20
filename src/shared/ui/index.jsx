function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function Button({ children, className = '', tone = 'primary', type = 'button', ...props }) {
  const toneClass =
    tone === 'primary'
      ? 'bg-[var(--accent-solid)] text-[var(--accent-on-solid)] hover:bg-[var(--accent-solid-hover)]'
      : tone === 'danger'
        ? 'bg-[var(--danger-solid)] text-white hover:opacity-90'
        : 'border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]';

  return (
    <button
      type={type}
      className={joinClassNames(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        toneClass,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={joinClassNames(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-transparent text-[var(--text-secondary)] transition hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function FieldFrame({ id, label, hint, error, required, children }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
        {required ? <span className="ml-1 text-[var(--danger-text)]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-[var(--danger-text)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function fieldDescription(id, hint, error) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextInput({ id, label, hint, error, required = false, className = '', ...props }) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, hint, error)}
        className={joinClassNames(
          'min-h-11 w-full rounded-lg border bg-[var(--surface-panel)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--focus-soft)]',
          error ? 'border-[var(--danger-solid)]' : 'border-[var(--border-default)]',
          className,
        )}
        {...props}
      />
    </FieldFrame>
  );
}

export function Textarea({ id, label, hint, error, required = false, className = '', ...props }) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, hint, error)}
        className={joinClassNames(
          'min-h-24 w-full resize-y rounded-lg border bg-[var(--surface-panel)] px-3 py-2.5 text-sm leading-5 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--focus-soft)]',
          error ? 'border-[var(--danger-solid)]' : 'border-[var(--border-default)]',
          className,
        )}
        {...props}
      />
    </FieldFrame>
  );
}

export function DateTimeField(props) {
  return <TextInput type="datetime-local" {...props} />;
}

const STATUS_LABELS = {
  DRAFT: 'Draft',
  RUNNING: 'Running',
  RESOLVED: 'Resolved',
  ARCHIVED: 'Archived',
};

export function StatusBadge({ status }) {
  const normalized = String(status || 'DRAFT').toUpperCase();
  return (
    <span
      className="inline-flex min-h-7 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 text-xs font-semibold text-[var(--text-secondary)]"
      data-status={normalized}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[var(--status-dot)]" aria-hidden="true" />
      {STATUS_LABELS[normalized] ?? normalized}
    </span>
  );
}

export function EmptyState({ title, description, action = null }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-panel)] p-8 text-center">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-5"
    >
      <h2 className="text-sm font-semibold text-[var(--danger-text)]">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{description}</p>
      {onRetry ? (
        <Button tone="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={joinClassNames(
        'animate-pulse rounded-lg bg-[var(--surface-muted-strong)]',
        className,
      )}
    />
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  tone = 'primary',
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-lg)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button tone={tone} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
