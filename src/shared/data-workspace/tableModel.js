import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createSortedRowModel,
  createTableHook,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table';

/**
 * Canonical feature registry for operational data tables.
 *
 * TanStack Table v9 makes features opt-in. Keeping the registry static and
 * outside React components ensures every operational table gets the same
 * sorting/filtering/visibility contract without pulling in unrelated table
 * capabilities such as grouping or row selection.
 */
export const operationalTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
  },
});

const { useAppTable: useOperationalTable, createAppColumnHelper: createOperationalColumnHelper } =
  createTableHook({
    features: operationalTableFeatures,
    enableSortingRemoval: true,
  });

/**
 * App-specific TanStack Table v9 hook.
 *
 * The wrapper deliberately does not own Ticket queries or mutations. Consumers
 * supply already-bounded data and column definitions; this hook owns only the
 * headless table mechanics shared across NOC workspaces.
 */
export function useDataTableModel(options, selector = (state) => state) {
  return useOperationalTable(
    {
      globalFilterFn: 'includesString',
      ...options,
    },
    selector,
  );
}

export const createDataTableColumnHelper = createOperationalColumnHelper;
