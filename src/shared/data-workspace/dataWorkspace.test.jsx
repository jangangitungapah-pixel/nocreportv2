import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DataTable } from './DataTable.jsx';
import { RowActionsMenu } from './RowActionsMenu.jsx';
import { VirtualizedList } from './VirtualizedList.jsx';
import { createDataTableInitialState, normalizeDataTableState } from './tableState.js';

const rows = [
  { id: 't-1', title: 'Zulu outage', pic: 'NOC A', status: 'RUNNING' },
  { id: 't-2', title: 'Alpha outage', pic: 'NOC B', status: 'RUNNING' },
  { id: 't-3', title: 'Bravo recovery', pic: 'NOC C', status: 'RESOLVED' },
];

const columns = [
  {
    accessorKey: 'title',
    header: 'Title',
    meta: { label: 'Title', mobilePrimary: true },
  },
  {
    accessorKey: 'pic',
    header: 'PIC',
    meta: { label: 'PIC' },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { label: 'Status' },
  },
];

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderTable() {
  return render(
    <DataTable
      ariaLabel="Incident workspace"
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      searchLabel="Search incidents"
      searchPlaceholder="TT, title, PIC"
    />,
  );
}

describe('MEGA-3 data workspace foundation', () => {
  it('sorts rows through the TanStack v9 sorting feature', async () => {
    renderTable();
    const desktop = screen.getByTestId('data-table-desktop');

    let renderedRows = within(desktop).getAllByRole('row');
    expect(within(renderedRows[1]).getByText('Zulu outage')).toBeInTheDocument();

    fireEvent.click(within(desktop).getByRole('button', { name: /^Sort by Title/ }));

    await waitFor(() => {
      renderedRows = within(desktop).getAllByRole('row');
      expect(within(renderedRows[1]).getByText('Alpha outage')).toBeInTheDocument();
      expect(within(renderedRows[2]).getByText('Bravo recovery')).toBeInTheDocument();
    });
  });

  it('filters the shared row model and keeps the same result available to mobile fallback', async () => {
    renderTable();
    fireEvent.change(screen.getByLabelText('Search incidents'), {
      target: { value: 'Bravo' },
    });

    const desktop = screen.getByTestId('data-table-desktop');
    const mobile = screen.getByTestId('data-table-mobile');

    await waitFor(() => {
      expect(within(desktop).getByText('Bravo recovery')).toBeInTheDocument();
      expect(within(desktop).queryByText('Alpha outage')).not.toBeInTheDocument();
      expect(within(mobile).getByText('Bravo recovery')).toBeInTheDocument();
      expect(within(mobile).queryByText('Alpha outage')).not.toBeInTheDocument();
    });
  });

  it('uses Radix Checkbox state to hide and restore a leaf column', async () => {
    renderTable();
    const desktop = screen.getByTestId('data-table-desktop');

    expect(within(desktop).getByRole('columnheader', { name: 'PIC' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose visible columns' }));

    const picCheckbox = await screen.findByRole('checkbox', { name: 'Show PIC column' });
    expect(picCheckbox).toHaveAttribute('data-state', 'checked');
    fireEvent.click(picCheckbox);

    await waitFor(() => {
      expect(within(desktop).queryByRole('columnheader', { name: 'PIC' })).not.toBeInTheDocument();
    });
  });

  it('executes feature-supplied row actions without owning permission logic', async () => {
    const onReview = vi.fn();
    const onArchive = vi.fn();

    render(
      <RowActionsMenu
        label="Actions for INC-1"
        actions={[
          { key: 'review', label: 'Review', onSelect: onReview },
          {
            key: 'archive',
            label: 'Archive',
            danger: true,
            separatorBefore: true,
            onSelect: onArchive,
          },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Actions for INC-1' });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    const review = await screen.findByRole('menuitem', { name: 'Review' });
    fireEvent.click(review);
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onArchive).not.toHaveBeenCalled();
  });

  it('normalizes persisted display state instead of trusting arbitrary storage payloads', () => {
    expect(
      normalizeDataTableState({
        sorting: [{ id: 'title', desc: 1 }, null, { id: 4 }],
        columnFilters: [{ id: 'status', value: 'RUNNING' }, { nope: true }],
        columnVisibility: { pic: false, status: 0 },
        globalFilter: 12,
      }),
    ).toEqual({
      sorting: [{ id: 'title', desc: true }],
      columnFilters: [{ id: 'status', value: 'RUNNING' }],
      columnVisibility: { pic: false, status: true },
      globalFilter: '',
    });

    expect(createDataTableInitialState()).toEqual({
      sorting: [],
      columnFilters: [],
      columnVisibility: {},
      globalFilter: '',
    });
  });

  it('virtualizes a long variable-height list instead of mounting every item', async () => {
    const items = Array.from({ length: 100 }, (_, index) => ({ id: `row-${index}`, index }));

    render(
      <VirtualizedList
        items={items}
        getItemKey={(item) => item.id}
        estimateSize={40}
        overscan={2}
        initialRect={{ width: 320, height: 240 }}
        initialOffset={0}
        className="h-60"
        renderItem={(item) => <div>Virtual incident {item.index}</div>}
      />,
    );

    await waitFor(() => {
      const mountedItems = screen.getAllByRole('listitem');
      expect(mountedItems.length).toBeGreaterThan(0);
      expect(mountedItems.length).toBeLessThan(100);
      expect(screen.getByText('Virtual incident 0')).toBeInTheDocument();
      expect(screen.queryByText('Virtual incident 99')).not.toBeInTheDocument();
    });
  });
});
