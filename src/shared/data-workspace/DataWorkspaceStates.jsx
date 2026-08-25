import { cn } from '../lib/cn.js';

function SkeletonBar({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-[5px] bg-[var(--surface-muted-strong)]', className)}
    />
  );
}

export function DataTableSkeleton({ rows = 6, columns = 5, className }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)]',
        className,
      )}
      aria-label="Loading data table"
      aria-busy="true"
    >
      <div
        className="grid min-h-[38px] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, index) => (
          <SkeletonBar key={index} className="h-2.5 w-16 max-w-full" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid min-h-[50px] items-center gap-3 border-b border-[var(--border-subtle)] px-3 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, columnIndex) => (
            <SkeletonBar
              key={columnIndex}
              className={cn('h-3', columnIndex === 0 ? 'w-4/5' : 'w-3/5')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DataListSkeleton({ rows = 5, className }) {
  return (
    <div className={cn('grid gap-2', className)} aria-label="Loading data list" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-5 w-16 rounded-full" />
          </div>
          <SkeletonBar className="mt-2 h-3.5 w-4/5" />
          <SkeletonBar className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function DataWorkspaceEmptyState({
  title = 'No data',
  description = 'There is nothing to display for the current view.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'grid min-h-40 place-items-center rounded-[var(--radius-panel)] border border-dashed border-[var(--border-default)] bg-[var(--surface-panel)] px-4 py-8 text-center',
        className,
      )}
    >
      <div className="max-w-md">
        <p className="text-sm font-bold tracking-[-0.01em] text-[var(--text-primary)]">{title}</p>
        <p className="mt-1.5 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
