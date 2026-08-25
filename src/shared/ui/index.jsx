import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';

import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogDescription as RadixDialogDescription,
  DialogTitle as RadixDialogTitle,
} from './primitives.jsx';

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function UiIcon({ name, size = 18, className = '' }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
  };

  const paths = {
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    close: (
      <>
        <path d="m6.5 6.5 11 11" />
        <path d="m17.5 6.5-11 11" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2.5" />
        <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
      </>
    ),
    edit: (
      <>
        <path d="M13.5 6.5 17.5 10.5" />
        <path d="m4.5 19.5 4.2-.8L18.4 9a2.1 2.1 0 0 0 0-3l-.4-.4a2.1 2.1 0 0 0-3 0l-9.7 9.7-.8 4.2Z" />
      </>
    ),
    arrowUp: (
      <>
        <path d="M12 19V5" />
        <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
      </>
    ),
    arrowDown: (
      <>
        <path d="M12 5v14" />
        <path d="m17.5 13.5-5.5 5.5-5.5-5.5" />
      </>
    ),
    chevronDown: <path d="m7 9.5 5 5 5-5" />,
    chevronUp: <path d="m7 14.5 5-5 5 5" />,
    check: <path d="m6.5 12.5 3.5 3.5 7.5-8" />,
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M8 3.5V7" />
        <path d="M16 3.5V7" />
        <path d="M3.5 9h17" />
        <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.46 5.46l1.42 1.42M17.12 17.12l1.42 1.42M18.54 5.46l-1.42 1.42M6.88 17.12l-1.42 1.42" />
      </>
    ),
    moon: <path d="M20 15.2A8.2 8.2 0 0 1 8.8 4a8.3 8.3 0 1 0 11.2 11.2Z" />,
    refresh: (
      <>
        <path d="M19 7.5V4l-2.2 2.2A8 8 0 1 0 20 12" />
        <path d="M19 4h-3.5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m15.5 15.5 4 4" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="4.5" rx="2" />
        <rect x="13.5" y="11" width="7" height="9.5" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      </>
    ),
    generator: (
      <>
        <path d="M7 3.5h7l4 4v13H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" />
        <path d="M14 3.5v4h4M8.5 12h6M8.5 16h4" />
      </>
    ),
    running: (
      <>
        <path d="M3.5 12h4l2-5 4.2 10 2.1-5h4.7" />
        <path d="M4 5.5h16M4 18.5h16" opacity=".35" />
      </>
    ),
    map: (
      <>
        <path d="m3.5 6.5 5-2 7 2.5 5-2v12.5l-5 2-7-2.5-5 2Z" />
        <path d="M8.5 4.5V17M15.5 7v12" />
      </>
    ),
    archive: (
      <>
        <path d="M4 7.5h16v11A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5Z" />
        <path d="M3 4h18v3.5H3ZM9 12h6" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10.5v6M12 7.25h.01" />
      </>
    ),
    warning: (
      <>
        <path d="M10.3 4.2 2.8 17.3A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.7L13.7 4.2a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 16.5h.01" />
      </>
    ),
    error: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name] ?? paths.info}</svg>;
}

export const Button = forwardRef(function Button(
  { children, className = '', tone = 'primary', type = 'button', ...props },
  ref,
) {
  const toneClass =
    tone === 'primary'
      ? 'border border-transparent bg-[var(--accent-solid)] text-[var(--accent-on-solid)] shadow-[var(--shadow-accent)] hover:-translate-y-0.5 hover:bg-[var(--accent-solid-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0'
      : tone === 'danger'
        ? 'border border-transparent bg-[var(--danger-solid)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:bg-[var(--danger-solid-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0'
        : 'border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:bg-[var(--surface-panel-strong)] hover:shadow-[var(--shadow-sm)] active:translate-y-0';

  return (
    <button
      ref={ref}
      type={type}
      className={joinClassNames(
        'ui-button relative isolate inline-flex min-h-[var(--control-height)] select-none items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-bold tracking-[-0.01em] transition-[transform,background-color,border-color,box-shadow,color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] active:scale-[0.985] disabled:translate-y-0 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
        toneClass,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton(
  { label, children, className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={joinClassNames(
        'ui-icon-button inline-flex min-h-11 min-w-11 select-none items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-glass)] text-[var(--text-secondary)] shadow-[var(--shadow-xs)] backdrop-blur-xl transition-[transform,background-color,border-color,box-shadow,color,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:bg-[var(--surface-panel)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] active:scale-[0.94] disabled:translate-y-0 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

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

const inputClass =
  'ui-control min-h-[var(--control-height)] w-full appearance-none rounded-xl border bg-[var(--surface-panel-strong)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,box-shadow,color] duration-200 placeholder:font-normal placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)] focus:border-[var(--accent-solid)] focus:bg-[var(--surface-panel)] focus:ring-4 focus:ring-[var(--focus-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)] disabled:opacity-65 read-only:bg-[var(--surface-muted)] read-only:text-[var(--text-secondary)]';

export const TextInput = forwardRef(function TextInput(
  { id, label, hint, error, required = false, className = '', ...props },
  ref,
) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required}>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, hint, error)}
        className={joinClassNames(
          inputClass,
          error ? 'border-[var(--danger-solid)]' : 'border-[var(--border-default)]',
          className,
        )}
        {...props}
      />
    </FieldFrame>
  );
});

export const Textarea = forwardRef(function Textarea(
  { id, label, hint, error, required = false, className = '', ...props },
  ref,
) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, hint, error)}
        className={joinClassNames(
          'ui-control ui-textarea min-h-28 w-full resize-none rounded-xl border bg-[var(--surface-panel-strong)] px-3.5 py-3 text-sm font-medium leading-6 text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,box-shadow,color] duration-200 placeholder:font-normal placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)] focus:border-[var(--accent-solid)] focus:bg-[var(--surface-panel)] focus:ring-4 focus:ring-[var(--focus-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)] disabled:opacity-65',
          error ? 'border-[var(--danger-solid)]' : 'border-[var(--border-default)]',
          className,
        )}
        {...props}
      />
    </FieldFrame>
  );
});

export const DateTimeField = forwardRef(function DateTimeField(
  { id, label, hint, error, required = false, className = '', disabled = false, ...props },
  forwardedRef,
) {
  const inputRef = useRef(null);
  useImperativeHandle(forwardedRef, () => inputRef.current);

  const openPicker = () => {
    if (disabled) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // Browser privacy/activation rules may block showPicker; focus still keeps the field usable.
    }
  };

  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="datetime-local"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={fieldDescription(id, hint, error)}
          className={joinClassNames(
            inputClass,
            'ui-datetime-input pr-12 tabular-nums',
            error ? 'border-[var(--danger-solid)]' : 'border-[var(--border-default)]',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
          aria-label={`Open ${label} picker`}
          className="ui-field-trigger absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[background-color,border-color,color,transform] duration-200 hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-95 disabled:pointer-events-none disabled:opacity-35"
          onClick={openPicker}
        >
          <UiIcon name="calendar" size={17} />
        </button>
      </div>
    </FieldFrame>
  );
});

export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  hint,
  error,
  required = false,
  disabled = false,
  className = '',
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex] ?? options[0];

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const choose = (index) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onValueChange?.(option.value);
    setActiveIndex(index);
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const move = (direction) => {
    if (options.length === 0) return;
    let next = activeIndex;
    for (let attempts = 0; attempts < options.length; attempts += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next]?.disabled) break;
    }
    setActiveIndex(next);
  };

  const onKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) setOpen(true);
      move(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) setOpen(true);
      move(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(Math.max(0, options.length - 1));
      return;
    }
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(activeIndex);
      else setOpen(true);
    }
  };

  return (
    <div ref={rootRef} className={joinClassNames('relative grid gap-2', className)}>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="text-[13px] font-bold tracking-[-0.01em] text-[var(--text-primary)]"
        onMouseDown={(event) => {
          event.preventDefault();
          buttonRef.current?.focus();
        }}
      >
        {label}
        {required ? <span className="ml-1 text-[var(--danger-text)]">*</span> : null}
      </label>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label`}
        aria-describedby={fieldDescription(id, hint, error)}
        aria-invalid={Boolean(error)}
        aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
        disabled={disabled}
        className={joinClassNames(
          'ui-control ui-select-trigger flex min-h-[var(--control-height)] w-full items-center justify-between gap-3 rounded-xl border bg-[var(--surface-panel-strong)] px-3.5 text-left text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-[var(--border-strong)] focus:border-[var(--accent-solid)] focus:bg-[var(--surface-panel)] focus:ring-4 focus:ring-[var(--focus-soft)] active:scale-[0.995] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)] disabled:opacity-65',
          error ? 'border-[var(--danger-solid)]' : 'border-[var(--border-default)]',
        )}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        onKeyDown={onKeyDown}
      >
        <span className="min-w-0 truncate">{selected?.label ?? 'Select…'}</span>
        <span
          className={joinClassNames(
            'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--surface-muted)] text-[var(--text-muted)] transition-[transform,background-color,color] duration-200',
            open ? 'rotate-180 bg-[var(--accent-soft)] text-[var(--accent-text)]' : '',
          )}
        >
          <UiIcon name="chevronDown" size={16} />
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="ui-select-popover absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[75] max-h-72 overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1.5 shadow-[var(--shadow-lg)] backdrop-blur-xl"
        >
          {options.map((option, index) => {
            const selectedOption = option.value === value;
            const active = index === activeIndex;
            return (
              <button
                key={option.value}
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={selectedOption}
                disabled={option.disabled}
                className={joinClassNames(
                  'flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-[background-color,color,transform] duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                  selectedOption
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                    : active
                      ? 'bg-[var(--surface-muted)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {selectedOption ? (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--surface-panel)] text-[var(--accent-text)] shadow-[var(--shadow-xs)]">
                    <UiIcon name="check" size={15} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

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
          className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] text-[var(--accent-text)] shadow-[var(--shadow-sm)]"
          aria-hidden="true"
        >
          <UiIcon name="info" size={19} />
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
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-panel)] text-[var(--danger-text)] shadow-[var(--shadow-xs)]"
          aria-hidden="true"
        >
          <UiIcon name="error" size={18} />
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
      className={joinClassNames('ui-skeleton rounded-2xl bg-[var(--surface-muted)]', className)}
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
  const cancelRef = useRef(null);

  return (
    <RadixDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.();
      }}
    >
      <RadixDialogContent
        className="w-full max-w-md rounded-[var(--radius-2xl)] p-5 md:p-6"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <span
          className="mb-5 block h-1.5 w-12 rounded-full bg-[var(--accent-solid)] shadow-[0_0_18px_var(--accent-glow)]"
          aria-hidden="true"
        />
        <RadixDialogTitle className="text-xl font-bold text-[var(--text-primary)]">
          {title}
        </RadixDialogTitle>
        <RadixDialogDescription className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </RadixDialogDescription>
        <div className="mt-7 flex flex-wrap justify-end gap-2">
          <Button ref={cancelRef} tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button tone={tone} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </RadixDialogContent>
    </RadixDialog>
  );
}
