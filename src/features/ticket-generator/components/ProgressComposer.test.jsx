import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProgressComposer } from './ProgressComposer.jsx';

afterEach(() => {
  cleanup();
});

describe('ProgressComposer persistence acknowledgement', () => {
  it('keeps the operator draft when persistence reports failure', async () => {
    const onAdd = vi.fn().mockResolvedValue(false);
    render(<ProgressComposer onAdd={onAdd} />);

    const input = screen.getByLabelText('Progress update');
    fireEvent.change(input, { target: { value: 'Team OTW ke lokasi CP' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add update' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add update' })).toBeEnabled());
    expect(input).toHaveValue('Team OTW ke lokasi CP');
  });

  it('clears the draft only after persistence succeeds', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<ProgressComposer onAdd={onAdd} />);

    const input = screen.getByLabelText('Progress update');
    fireEvent.change(input, { target: { value: 'Link normalization observed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add update' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(input).toHaveValue(''));
  });
});
