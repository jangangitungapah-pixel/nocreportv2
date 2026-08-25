import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';

import { cn } from '../lib/cn.js';
import { AppIcon } from './icon.jsx';
import {
  Button as CanonicalButton,
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogDescription as RadixDialogDescription,
  DialogTitle as RadixDialogTitle,
} from './primitives.jsx';

export const Button = CanonicalButton;

export const IconButton = forwardRef(function IconButton(
  { label, children, className, tone = 'secondary', ...props },
  ref,
) {
  return (
    <CanonicalButton
      ref={ref}
      type="button"
      tone={tone}
      size="icon"
      aria-label={label}
      className={className}
      {...props}
    >
      {children}
    </CanonicalButton>
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
  'ui-control min-h-[var(--control-height)] w-full appearance-none rounded-[var(--radius-control)] border bg-[var(--surface-panel-strong)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,box-shadow,color] duration-[var(--motion-base)] placeholder:font-normal placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)] focus:border-[var(--accent-solid)] focus:bg-[var(--surface-panel)] focus:ring-4 focus:ring-[var(--focus-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)] disabled:opacity-65 read-only:bg-[var(--surface-muted)] read-only:text-[var(--text-secondary)]';

export const TextInput = forwardRef(function TextInput(
  { id, label, hint, error, required = false, className, ...props },
  ref,
) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required}>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, hint, error)}
        className={cn(
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
  { id, label, hint, error, required = false, className, ...props },
  ref,
) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, hint, error)}
        className={cn(
          inputClass,
          'ui-textarea min-h-28 resize-none py-3 leading-6',
          error ? 'border-[var(--danger-solid)]' : 'border-[var(--border-default)]',
          className,
        )}
        {...props}
      />
    </FieldFrame>
  );
});

export const DateTimeField = forwardRef(function DateTimeField(
  { id, label, hint, error, required = false, className, disabled = false, ...props },
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
      // Browser activation/privacy rules may block showPicker; focused native input remains usable.
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
          className={cn(
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
          className="ui-field-trigger absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[var(--radius-control)] border border-transparent text-[var(--text-muted)] transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-95 disabled:pointer-events-none disabled:opacity-35"
          onClick={openPicker}
        >
          <AppIcon name="calendar" size={17} />
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
  className,
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
    <div ref={rootRef} className={cn('relative grid gap-2', className)}>
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
        className={cn(
          'ui-control ui-select-trigger flex min-h-[var(--control-height)] w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border bg-[var(--surface-panel-strong)] px-3.5 text-left text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,box-shadow,transform] duration-[var(--motion-base)] hover:border-[var(--border-strong)] focus:border-[var(--accent-solid)] focus:bg-[var(--surface-panel)] focus:ring-4 focus:ring-[var(--focus-soft)] active:scale-[0.995] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)] disabled:opacity-65',
          error ? 'border-[var(--danger-solid)]' : 'border-[var(--border-default)]',
        )}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        onKeyDown={onKeyDown}
      >
        <span className="min-w-0 truncate">{selected?.label ?? 'Select…'}</span>
        <span
          className={cn(
            'grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--surface-muted)] text-[var(--text-muted)] transition-[transform,background-color,color] duration-[var(--motion-base)]',
            open && 'rotate-180 bg-[var(--accent-soft)] text-[var(--accent-text)]',
          )}
          aria-hidden="true"
        >
          <AppIcon name="chevronDown" size={16} />
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="ui-select-popover absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[75] max-h-72 overflow-auto rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1.5 shadow-[var(--shadow-lg)] backdrop-blur-xl"
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
                className={cn(
                  'flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-control)] px-3 text-left text-sm font-semibold transition-[background-color,color] duration-[var(--motion-fast)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
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
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--surface-panel)] text-[var(--accent-text)] shadow-[var(--shadow-xs)]"
                    aria-hidden="true"
                  >
                    <AppIcon name="check" size={15} />
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
    <div className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 text-center shadow-[var(--shadow-xs)]">
      <div className="mx-auto max-w-xl">
        <span
          className="mx-auto grid h-10 w-10 place-items-center rounded-[var(--radius-control)] border border-[var(--border-accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
          aria-hidden="true"
        >
          <AppIcon name="info" size={18} />
        </span>
        <h2 className="mt-3 text-sm font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1.5 text-[12px] leading-5 text-[var(--text-secondary)]">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-panel)] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 shadow-[var(--shadow-xs)]"
    >
      <div className="flex gap-3">
        <span
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--surface-panel)] text-[var(--danger-text)] shadow-[var(--shadow-xs)]"
          aria-hidden="true"
        >
          <AppIcon name="error" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[var(--danger-text)]">{title}</h2>
          <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{description}</p>
          {onRetry ? (
            <CanonicalButton tone="secondary" size="sm" className="mt-3" onClick={onRetry}>
              Try again
            </CanonicalButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn('ui-skeleton rounded-[var(--radius-panel)] bg-[var(--surface-muted)]', className)}
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
        className="w-full max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <span
          className="mb-4 block h-1 w-10 rounded-full bg-[var(--accent-solid)]"
          aria-hidden="true"
        />
        <RadixDialogTitle className="text-lg font-bold text-[var(--text-primary)]">
          {title}
        </RadixDialogTitle>
        <RadixDialogDescription className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
          {description}
        </RadixDialogDescription>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <CanonicalButton ref={cancelRef} tone="secondary" size="sm" onClick={onClose}>
            Cancel
          </CanonicalButton>
          <CanonicalButton tone={tone} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </CanonicalButton>
        </div>
      </RadixDialogContent>
    </RadixDialog>
  );
}
