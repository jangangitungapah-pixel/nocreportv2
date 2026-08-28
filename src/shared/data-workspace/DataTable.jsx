import { cn } from '../lib/cn.js';
import { AppIcon } from '../ui/icon.jsx';
import { TextInput } from '../ui/index.jsx';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu.jsx';
import {
  DataListSkeleton,
  DataTableSkeleton,
  DataWorkspaceEmptyState,
} from './DataWorkspaceStates.jsx';
import { useDataTableModel } from './tableModel.js';
import { useDataTableState } from './tableState.js';

function getColumnLabel(column) {
  const metaLabel = column.columnDef?.meta?.label;
  if (typeof metaLabel === 'string' && metaLabel.trim()) return metaLabel;

  const header = column.columnDef?.header;
  if (typeof header === 'string' && header.trim()) return header;

  return column.id;
}

function SortIndicator({ direction }) {
  const icon = direction === 'asc' ? 'arrowUp' : direction === 'desc' ? 'arrowDown' : 'sort';
  return (
    <AppIcon
      name={icon}
      size={13}
      className={direction ? 'text-[var(--accent-text)]' : 'text-[var(--text-faint)]'}
    />
  );
}

function HeaderContent({ table, header }) {
  if (header.isPlaceholder) return null;

  const sortable = header.column.getCanSort();
  const direction = header.column.getIsSorted();
  const label = getColumnLabel(header.column);
  const rendered = <table.FlexRender header={header} />;

  if (!sortable) return rendered;

  return (
    <button
      type="button"
      onClick={header.column.getToggleSortingHandler()}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-[6px] px-1.5 text-left outline-none transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      aria-label={`Sort by ${label}${direction ? `, currently ${direction}` : ''}`}
    >
      <span>{rendered}</span>
      <SortIndicator direction={direction} />
    </button>
  );
}

function DefaultMobileRow({ row, table }) {
  const cells = row
    .getVisibleCells()
    .filter((cell) => cell.column.columnDef?.meta?.mobileHidden !== true);
  const primaryCell =
    cells.find((cell) => cell.column.columnDef?.meta?.mobilePrimary === true) ?? cells[0];
  const secondaryCells = cells.filter((cell) => cell !== primaryCell);

  return (
    <article className="data-mobile-card rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-3 shadow-[var(--shadow-xs)]">
      {primaryCell ? (
        <div className="text-sm font-bold tracking-[-0.01em] text-[var(--text-primary)]">
          <table.FlexRender cell={primaryCell} />
        </div>
      ) : null}
      {secondaryCells.length > 0 ? (
        <dl className="mt-2.5 grid gap-2 text-xs">
          {secondaryCells.map((cell) => (
            <div key={cell.id} className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                {cell.column.columnDef?.meta?.mobileLabel ?? getColumnLabel(cell.column)}
              </dt>
              <dd className="min-w-0 text-right font-semibold text-[var(--text-secondary)]">
                <table.FlexRender cell={cell} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

const ROW_DENSITY_CLASS = Object.freeze({
  compact: '[&_td]:py-2.5',
  standard: '[&_td]:py-3',
  'two-line': '[&_td]:py-3.5',
});

/**
 * Canonical responsive operational DataTable.
 *
 * Business data remains supplied by the feature layer. The component owns
 * presentation state and TanStack row-model mechanics only.
 */
export function DataTable({
  data,
  columns,
  getRowId,
  ariaLabel = 'Operational data table',
  loading = false,
  searchable = true,
  searchLabel = 'Search table',
  searchPlaceholder = 'Search…',
  showColumnVisibility = true,
  toolbar,
  initialState,
  storageKey,
  state: controlledState,
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  onGlobalFilterChange,
  manualFiltering = false,
  manualSorting = false,
  mobileRow,
  rowDensity = 'compact',
  emptyTitle = 'No data',
  emptyDescription = 'There is nothing to display for the current view.',
  emptyAction,
  skeletonRows = 6,
  className,
  tableClassName,
  minWidth = 760,
  getRowClassName,
}) {
  const internalState = useDataTableState({ initialState, storageKey });
  const state = controlledState ?? internalState.state;

  const table = useDataTableModel({
    data,
    columns,
    getRowId,
    state,
    onSortingChange: onSortingChange ?? internalState.onSortingChange,
    onColumnFiltersChange: onColumnFiltersChange ?? internalState.onColumnFiltersChange,
    onColumnVisibilityChange: onColumnVisibilityChange ?? internalState.onColumnVisibilityChange,
    onGlobalFilterChange: onGlobalFilterChange ?? internalState.onGlobalFilterChange,
    manualFiltering,
    manualSorting,
  });

  const rows = table.getRowModel().rows;
  const columnCount = Math.max(table.getVisibleLeafColumns().length, 1);
  const MobileRow = mobileRow;

  if (loading) {
    return (
      <div className={cn('grid gap-2', className)}>
        <DataTableSkeleton
          rows={skeletonRows}
          columns={Math.min(columnCount, 7)}
          className="hidden md:block"
        />
        <DataListSkeleton rows={Math.min(skeletonRows, 5)} className="md:hidden" />
      </div>
    );
  }

  return (
    <section className={cn('grid gap-2.5', className)} aria-label={ariaLabel}>
      {searchable || showColumnVisibility || toolbar ? (
        <div className="data-table-toolbar flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="data-table-toolbar__search min-w-0 flex-1 sm:max-w-sm">
            {searchable ? (
              <TextInput
                id={`${ariaLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-search`}
                label={searchLabel}
                placeholder={searchPlaceholder}
                value={state.globalFilter ?? ''}
                onChange={(event) =>
                  (onGlobalFilterChange ?? internalState.onGlobalFilterChange)(event.target.value)
                }
              />
            ) : null}
          </div>
          <div className="data-table-toolbar__actions flex flex-wrap items-center justify-end gap-2">
            {toolbar}
            {showColumnVisibility ? (
              <div className="data-table-column-visibility">
                <ColumnVisibilityMenu table={table} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <DataWorkspaceEmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <>
          <div
            className="data-table-shell hidden overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)] md:block"
            data-testid="data-table-desktop"
          >
            <table
              className={cn(
                'w-full border-collapse text-left text-xs text-[var(--text-secondary)]',
                ROW_DENSITY_CLASS[rowDensity] ?? ROW_DENSITY_CLASS.compact,
                tableClassName,
              )}
              style={{ minWidth }}
            >
              <thead className="sticky top-0 z-[1] bg-[var(--surface-panel-strong)] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          'h-9 whitespace-nowrap border-b border-[var(--border-subtle)] px-3 align-middle',
                          header.column.columnDef?.meta?.headerClassName,
                        )}
                        scope="col"
                      >
                        <HeaderContent table={table} header={header} />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-[var(--border-subtle)] align-middle transition-colors last:border-b-0 hover:bg-[var(--surface-muted)]',
                      getRowClassName?.(row),
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn('px-3 leading-5', cell.column.columnDef?.meta?.cellClassName)}
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="data-mobile-list grid gap-2 md:hidden"
            data-testid="data-table-mobile"
            role="list"
          >
            {rows.map((row) => (
              <div key={row.id} role="listitem">
                {MobileRow ? (
                  <MobileRow row={row} table={table} />
                ) : (
                  <DefaultMobileRow row={row} table={table} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
