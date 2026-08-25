import { useLocation } from 'react-router-dom';

import { cn } from '../../shared/lib/cn.js';
import { getPageMeta } from '../navigation.js';

export function useCurrentPageMeta() {
  const location = useLocation();
  return getPageMeta(location.pathname);
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  leading,
  variant = 'page',
  className,
}) {
  const routeMeta = useCurrentPageMeta();
  const resolvedTitle = title ?? routeMeta.label;
  const resolvedEyebrow = eyebrow === false ? null : (eyebrow ?? routeMeta.eyebrow);

  if (variant === 'shell') {
    return (
      <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
        {leading}
        <div className="min-w-0">
          {resolvedEyebrow ? (
            <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-text)] lg:hidden">
              {resolvedEyebrow}
            </p>
          ) : null}
          <h1 className="truncate font-[var(--font-display)] text-base font-bold tracking-[-0.025em] md:text-[17px]">
            {resolvedTitle}
          </h1>
        </div>
        {actions ? <div className="ml-auto shrink-0">{actions}</div> : null}
      </div>
    );
  }

  return (
    <header
      className={cn(
        'flex min-h-11 flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-2.5',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {resolvedEyebrow ? (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[var(--text-faint)]">
            {resolvedEyebrow}
          </p>
        ) : null}
        <h2 className="mt-0.5 truncate font-[var(--font-display)] text-xl font-bold tracking-[-0.03em] md:text-[22px]">
          {resolvedTitle}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
