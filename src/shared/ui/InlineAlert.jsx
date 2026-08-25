import { cva } from 'class-variance-authority';

import { cn } from '../lib/cn.js';
import { AppIcon } from './icon.jsx';

const inlineAlertVariants = cva(
  'flex items-start gap-2.5 rounded-[var(--radius-panel)] border px-3 py-2.5 text-[11.5px] leading-5 shadow-[var(--shadow-xs)]',
  {
    variants: {
      tone: {
        info: 'border-[var(--border-accent)] bg-[var(--accent-soft)] text-[var(--text-secondary)]',
        success: 'border-transparent bg-[var(--success-soft)] text-[var(--success-text)]',
        warning: 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]',
        danger: 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]',
      },
    },
    defaultVariants: {
      tone: 'info',
    },
  },
);

const ICON_BY_TONE = Object.freeze({
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'error',
});

export function InlineAlert({
  tone = 'info',
  title = null,
  children,
  className,
  role,
  ...props
}) {
  return (
    <div
      role={role}
      className={cn(inlineAlertVariants({ tone }), className)}
      data-tone={tone}
      {...props}
    >
      <span
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--surface-panel)]/70"
        aria-hidden="true"
      >
        <AppIcon name={ICON_BY_TONE[tone] ?? 'info'} size={14} />
      </span>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-extrabold text-current">{title}</p> : null}
        <div className={cn(title && 'mt-0.5', 'font-medium text-current')}>{children}</div>
      </div>
    </div>
  );
}
