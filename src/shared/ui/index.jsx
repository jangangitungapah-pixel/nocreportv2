import { useEffect, useId, useRef } from 'react';

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function Button({ children, className = '', tone = 'primary', type = 'button', ...props }) {
  const toneClass =
    tone === 'primary'
      ? 'border border-transparent bg-[var(--accent-solid)] text-[var(--accent-on-solid)] shadow-[var(--shadow-accent)] hover:-translate-y-0.5 hover:bg-[var(--accent-solid-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0'
      : tone === 'danger'
        ? 'border border-transparent bg-[var(--danger-solid)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:opacity-92 active:translate-y-0'
        : 'border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:bg-[var(--surface-panel-strong)] hover:shadow-[var(--shadow-sm)] active:translate-y-0';

  return (
    <button
      type={type}
      className={joinClassNames(
        'inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold tracking-[-0.01em] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
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
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-glass)] text-[var(--text-secondary)] shadow-[var(--shadow-xs)] backdrop-blur-xl transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:bg-[var(--surface-panel)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] active:translate-y-0',
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
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className="text-[13px] font-bold tracking-[-0.01em] text-[var(--text-primary)]"
      >
        {label}
        {required ? <span className="ml-1 text-[var(--danger-text)]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-semibold leading-5 text-[var(--danger-text)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-5 text-[var(--text-muted)]">
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
          'min-h-[var(--control-height)] w-full rounded-xl border bg-[var(--surface-panel-strong)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,box-shadow] duration-200 placeholder:font-normal placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)] focus:border-[var(--accent-solid)] focus:bg-[var(--surface-panel)] focus:ring-4 focus:ring-[var(--focus-soft)]',
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
          'min-h-28 w-full resize-y rounded-xl border bg-[var(--surface-panel-strong)] px-3.5 py-3 text-sm font-medium leading-6 text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,box-shadow] duration-200 placeholder:font-normal placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)] focus:border-[var(--accent-solid)] focus:bg-[var(--surface-panel)] focus:ring-4 focus:ring-[var(--focus-soft)]',
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
      className="inline-flex min-h-7 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-2.5 text-[11px] font-extrabold tracking-[0.02em] text-[var(--text-secondary)] shadow-[var(--shadow-xs)]"
      data-status={normalized}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[var(--status-dot)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--status-dot)_14%,transparent)]"
        aria-hidden="true"
      />
      {STATUS_LABELS[normalized] ?? normalized}
    </span>
  );
}

export function EmptyState({ title, description, action = null }) {
  return (
    <div className="spatial-panel relative overflow-hidden p-8 text-center md:p-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_center,var(--accent-glow),transparent_68%)] opacity-60"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-xl">
        <span
          className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] text-lg text-[var(--accent-text)] shadow-[var(--shadow-sm)]"
          aria-hidden="true"
        >
          ·
        </span>
        <h2 className="mt-4 text-lg font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-5 shadow-[var(--shadow-xs)]"
    >
      <div className="flex gap-3">
        <span
          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--surface-panel)] text-sm font-black text-[var(--danger-text)] shadow-[var(--shadow-xs)]"
          aria-hidden="true"
        >
          !
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[var(--danger-text)]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
          {onRetry ? (
            <Button tone="secondary" className="mt-4" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={joinClassNames(
        'animate-pulse rounded-2xl bg-[linear-gradient(110deg,var(--surface-muted)_8%,var(--surface-muted-strong)_18%,var(--surface-muted)_33%)] bg-[length:200%_100%]',
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
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    previousActiveElementRef.current = document.activeElement;
    cancelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-[#090c12]/55 p-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-lg)] md:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span
          className="mb-5 block h-1.5 w-12 rounded-full bg-[var(--accent-solid)]"
          aria-hidden="true"
        />
        <h2 id={titleId} className="text-xl font-bold text-[var(--text-primary)]">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
        <div className="mt-7 flex flex-wrap justify-end gap-2">
          <Button ref={cancelRef} tone="secondary" onClick={onClose}>
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
