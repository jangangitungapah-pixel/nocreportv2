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
      <div className={cn('shell-page-header flex min-w-0 items-center gap-2.5', className)}>
        {leading}
        <div className="shell-page-header__copy min-w-0">
          {resolvedEyebrow ? (
            <p className="shell-page-header__eyebrow text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--accent-text)] lg:hidden">
              {resolvedEyebrow}
            </p>
          ) : null}
          <h1 className="shell-page-header__title truncate font-[var(--font-display)] text-base font-semibold tracking-[-0.025em] md:text-[16px]">
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
        'page-header flex min-h-11 flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-2.5',
        className,
      )}
    >
      <div className="page-header__copy min-w-0 flex-1">
        {resolvedEyebrow ? (
          <p className="page-header__eyebrow text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            {resolvedEyebrow}
          </p>
        ) : null}
        <h2 className="page-header__title mt-0.5 truncate font-[var(--font-display)] text-xl font-semibold tracking-[-0.03em] md:text-[21px]">
          {resolvedTitle}
        </h2>
        {description ? (
          <p className="page-header__description mt-1 max-w-3xl text-xs font-normal leading-5 text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="page-header__actions flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
