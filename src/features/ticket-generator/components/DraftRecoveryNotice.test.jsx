import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DraftRecoveryNotice } from './DraftRecoveryNotice.jsx';

describe('DraftRecoveryNotice', () => {
  it('offers explicit Restore or Discard for a compatible recovery draft', () => {
    const onRestore = vi.fn();
    const onDiscard = vi.fn();

    render(
      <DraftRecoveryNotice
        recovery={{
          state: 'available',
          payload: { dirtyAt: '2026-08-26T17:00:00.000Z', formValues: { title: 'Draft title' } },
        }}
        currentValues={{ title: '' }}
        onRestore={onRestore}
        onDiscard={onDiscard}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(onRestore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('requires an explicit stale-draft review before Apply is available', () => {
    const onRestore = vi.fn();

    render(
      <DraftRecoveryNotice
        recovery={{
          state: 'stale',
          payload: {
            dirtyAt: '2026-08-26T17:00:00.000Z',
            baseRevision: 8,
            formValues: { title: 'Recovered title', pic: 'Team B' },
          },
        }}
        currentRevision={9}
        currentValues={{ title: 'Current title', pic: 'Team A' }}
        onRestore={onRestore}
        onDiscard={() => {}}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Apply reviewed draft' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review stale draft' }));
    expect(screen.getByText('Current: Current title')).toBeInTheDocument();
    expect(screen.getByText('Draft: Recovered title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply reviewed draft' }));
    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});
