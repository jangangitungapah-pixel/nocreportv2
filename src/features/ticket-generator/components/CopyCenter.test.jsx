import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CopyCenter } from './CopyCenter.jsx';

const ticket = {
  title: '[MANDAU] LINK DOWN NODE_A <> NODE_B [TT : INC-20260826-00000001]',
  externalTtNumber: 'INC-20260826-00000001',
  status: 'RUNNING',
  occurAt: new Date(2026, 7, 26, 10, 0),
  pic: 'Team A',
  progress: [{ id: 'p1', occurredAt: new Date(2026, 7, 26, 11, 0), text: 'team OTW' }],
};

afterEach(() => cleanup());

describe('CopyCenter', () => {
  it('previews and explicitly copies the selected canonical target', () => {
    const onCopy = vi.fn();
    render(<CopyCenter ticket={ticket} selectedTargetId="title" onCopy={onCopy} />);

    expect(screen.getByText(ticket.title)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy Title' }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy.mock.calls[0][0]).toMatchObject({
      id: 'title',
      label: 'Title',
      text: ticket.title,
      available: true,
    });
  });

  it('supports collapse and a dedicated handover preview without auto-copying', () => {
    const onExpandedChange = vi.fn();
    const onHandoverExpandedChange = vi.fn();
    const onCopy = vi.fn();

    const { rerender } = render(
      <CopyCenter
        ticket={ticket}
        expanded
        handoverExpanded={false}
        onExpandedChange={onExpandedChange}
        onHandoverExpandedChange={onHandoverExpandedChange}
        onCopy={onCopy}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(onHandoverExpandedChange).toHaveBeenCalledWith(true);
    expect(onCopy).not.toHaveBeenCalled();

    rerender(
      <CopyCenter
        ticket={ticket}
        expanded
        handoverExpanded
        onExpandedChange={onExpandedChange}
        onHandoverExpandedChange={onHandoverExpandedChange}
        onCopy={onCopy}
      />,
    );
    expect(screen.getByText(/TT: INC-20260826-00000001/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(onExpandedChange).toHaveBeenCalledWith(false);
  });
});
