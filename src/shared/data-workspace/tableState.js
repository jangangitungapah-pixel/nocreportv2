import { useEffect, useMemo, useState } from 'react';

const EMPTY_STATE = Object.freeze({
  sorting: [],
  columnFilters: [],
  columnVisibility: {},
  globalFilter: '',
});

function resolveUpdater(updater, current) {
  return typeof updater === 'function' ? updater(current) : updater;
}

function sanitizeSorting(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry.id === 'string')
    .map((entry) => ({ id: entry.id, desc: Boolean(entry.desc) }));
}

function sanitizeColumnFilters(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => entry && typeof entry.id === 'string');
}

function sanitizeColumnVisibility(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => typeof key === 'string' && key.length > 0)
      .map(([key, visible]) => [key, visible !== false]),
  );
}

export function normalizeDataTableState(value = {}) {
  return {
    sorting: sanitizeSorting(value.sorting),
    columnFilters: sanitizeColumnFilters(value.columnFilters),
    columnVisibility: sanitizeColumnVisibility(value.columnVisibility),
    globalFilter: typeof value.globalFilter === 'string' ? value.globalFilter : '',
  };
}

export function createDataTableInitialState(overrides = {}) {
  return normalizeDataTableState({ ...EMPTY_STATE, ...overrides });
}

function readPersistedState(storageKey) {
  if (!storageKey || typeof window === 'undefined') return null;
  try {
    const serialized = window.localStorage.getItem(storageKey);
    if (!serialized) return null;
    return normalizeDataTableState(JSON.parse(serialized));
  } catch {
    return null;
  }
}

function persistState(storageKey, state) {
  if (!storageKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(normalizeDataTableState(state)));
  } catch {
    // A private/locked-down browser may block localStorage. Table interaction
    // must keep working even when display preferences cannot be persisted.
  }
}

/**
 * Shared controlled state bridge for TanStack Table v9.
 *
 * Keeping state controlled gives pages one predictable integration surface and
 * makes it straightforward to bind search controls, column menus, and future
 * server-side/manual modes without leaking table internals into business code.
 */
export function useDataTableState({ initialState, storageKey } = {}) {
  const normalizedInitialState = useMemo(
    () => createDataTableInitialState(initialState),
    [initialState],
  );
  const [state, setState] = useState(
    () => readPersistedState(storageKey) ?? normalizedInitialState,
  );

  useEffect(() => {
    persistState(storageKey, state);
  }, [state, storageKey]);

  const handlers = useMemo(
    () => ({
      onSortingChange: (updater) =>
        setState((current) => ({
          ...current,
          sorting: sanitizeSorting(resolveUpdater(updater, current.sorting)),
        })),
      onColumnFiltersChange: (updater) =>
        setState((current) => ({
          ...current,
          columnFilters: sanitizeColumnFilters(resolveUpdater(updater, current.columnFilters)),
        })),
      onColumnVisibilityChange: (updater) =>
        setState((current) => ({
          ...current,
          columnVisibility: sanitizeColumnVisibility(
            resolveUpdater(updater, current.columnVisibility),
          ),
        })),
      onGlobalFilterChange: (updater) =>
        setState((current) => ({
          ...current,
          globalFilter: String(resolveUpdater(updater, current.globalFilter) ?? ''),
        })),
      resetDataTableState: () => setState(normalizedInitialState),
    }),
    [normalizedInitialState],
  );

  return { state, setState, ...handlers };
}
