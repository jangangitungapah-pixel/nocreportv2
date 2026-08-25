import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-bold tracking-[-0.01em] transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-[var(--motion-base)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      tone: {
        primary:
          'border border-transparent bg-[var(--accent-solid)] text-[var(--accent-on-solid)] shadow-[var(--shadow-xs)] hover:bg-[var(--accent-solid-hover)]',
        secondary:
          'border border-[var(--border-default)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel-strong)]',
        ghost:
          'border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
        danger:
          'border border-transparent bg-[var(--danger-solid)] text-white shadow-[var(--shadow-xs)] hover:bg-[var(--danger-solid-hover)]',
      },
      size: {
        xs: 'min-h-[var(--control-height-xs)] rounded-[var(--radius-control)] px-2.5 text-[11px]',
        sm: 'min-h-[var(--control-height-sm)] rounded-[var(--radius-control)] px-3 text-xs',
        md: 'min-h-[var(--control-height)] rounded-[var(--radius-control)] px-3.5 text-sm',
        touch:
          'min-h-[var(--control-height-touch)] rounded-[var(--radius-control)] px-4 text-sm md:min-h-[var(--control-height)]',
        icon: 'h-[var(--control-height-sm)] w-[var(--control-height-sm)] rounded-[var(--radius-control)] p-0',
      },
    },
    defaultVariants: {
      tone: 'primary',
      size: 'md',
    },
  },
);

export const panelVariants = cva('border border-[var(--border-subtle)] bg-[var(--surface-panel)]', {
  variants: {
    density: {
      compact: 'rounded-[var(--radius-panel)] p-[var(--panel-padding-compact)]',
      normal: 'rounded-[var(--radius-panel)] p-[var(--panel-padding)]',
    },
    elevation: {
      flat: 'shadow-none',
      subtle: 'shadow-[var(--shadow-xs)]',
      floating: 'shadow-[var(--shadow-md)]',
    },
  },
  defaultVariants: {
    density: 'normal',
    elevation: 'subtle',
  },
});

export const badgeVariants = cva(
  'inline-flex min-h-[var(--badge-height)] items-center gap-1.5 rounded-[var(--radius-pill)] border px-2 text-[10px] font-bold leading-none',
  {
    variants: {
      tone: {
        neutral:
          'border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)]',
        accent: 'border-[var(--border-accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]',
        success:
          'border-transparent bg-[var(--success-soft)] text-[var(--success-text)]',
        warning:
          'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]',
        danger: 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);
