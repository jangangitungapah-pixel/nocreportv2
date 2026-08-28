import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ValidationCenter } from './ValidationCenter.jsx';

afterEach(() => cleanup());

describe('GEN-F4 ValidationCenter UI', () => {
  it('renders readiness, minute-level metrics and focuses linked findings', () => {
    const onFocusField = vi.fn();
    render(
      <ValidationCenter
        onFocusField={onFocusField}
        validation={{
          readyForRunning: false,
          counts: { blocking: 1, warning: 1, info: 0 },
          time: {
            timezone: 'Asia/Jakarta',
            mttrMs: 125 * 60_000,
            dispatchDelayMs: 10 * 60_000,
            latestProgressAgeMs: 5 * 60_000,
            resolvedDurationMs: null,
            latestUpdateAgeMs: 3 * 60_000,
          },
          findings: [
            {
              id: 'blocking:RUNNING_REQUIRED_TITLE:title',
              severity: 'blocking',
              code: 'RUNNING_REQUIRED_TITLE',
              field: 'title',
              message: 'Title is required.',
            },
            {
              id: 'warning:PIC_EMPTY:pic',
              severity: 'warning',
              code: 'PIC_EMPTY',
              field: 'pic',
              message: 'PIC is empty.',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('1 blocking')).toBeInTheDocument();
    expect(screen.getByText('MTTR')).toBeInTheDocument();
    expect(screen.getByText('2h 5m')).toBeInTheDocument();
    expect(screen.getByText('10m')).toBeInTheDocument();
    expect(screen.getByText('Asia/Jakarta', { exact: false })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Title is required/i }));
    expect(onFocusField).toHaveBeenCalledWith('title');
  });

  it('collapses and expands readiness details while keeping the summary visible', () => {
    render(
      <ValidationCenter
        validation={{
          readyForRunning: false,
          counts: { blocking: 1, warning: 0, info: 0 },
          time: {
            timezone: 'Asia/Jakarta',
            mttrMs: 60_000,
          },
          findings: [
            {
              id: 'blocking:RUNNING_REQUIRED_TITLE:title',
              severity: 'blocking',
              code: 'RUNNING_REQUIRED_TITLE',
              field: 'title',
              message: 'Title is required.',
            },
          ],
        }}
      />,
    );

    const collapseButton = screen.getByRole('button', { name: 'Collapse Validation Center' });
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('MTTR')).toBeVisible();

    fireEvent.click(collapseButton);

    const expandButton = screen.getByRole('button', { name: 'Expand Validation Center' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('MTTR')).not.toBeVisible();
    expect(screen.getByText('1 blocking')).toBeVisible();

    fireEvent.click(expandButton);
    expect(screen.getByText('MTTR')).toBeVisible();
  });

  it('shows a compact collapsed Running ready state when no blockers remain', () => {
    render(
      <ValidationCenter
        validation={{
          readyForRunning: true,
          counts: { blocking: 0, warning: 0, info: 0 },
          time: { timezone: 'Asia/Jakarta' },
          findings: [],
        }}
      />,
    );

    expect(screen.getByText('Running ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Validation Center' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('MTTR')).not.toBeVisible();
    expect(screen.queryByText(/No derived findings/i)).not.toBeInTheDocument();
  });
});
