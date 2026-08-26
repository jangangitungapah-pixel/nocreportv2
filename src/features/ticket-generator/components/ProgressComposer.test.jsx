import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY } from '../lib/progressSnippets.js';
import { ProgressComposer } from './ProgressComposer.jsx';

beforeEach(() => {
  window.localStorage.clear();
});

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

  it('defaults event time to now but lets the operator override it before submit', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<ProgressComposer onAdd={onAdd} />);

    const eventTime = screen.getByLabelText('Event time');
    expect(eventTime.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

    const overriddenTime = '2026-08-26T07:30';
    fireEvent.change(eventTime, { target: { value: overriddenTime } });
    fireEvent.change(screen.getByLabelText('Progress update'), {
      target: { value: 'Backdated operational update' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add update' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0].occurredAt.getTime()).toBe(new Date(overriddenTime).getTime());
  });

  it('keeps Ctrl/Cmd+Enter scoped to the Progress editor as the fast submit path', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<ProgressComposer onAdd={onAdd} />);

    const input = screen.getByLabelText('Progress update');
    fireEvent.change(input, { target: { value: 'Quick keyboard update' } });
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ text: 'Quick keyboard update' });
  });
});

describe('GEN-F3 reusable Progress snippets', () => {
  it('requires placeholders, fills only the editor, and leaves generated text editable', () => {
    const onAdd = vi.fn();
    render(<ProgressComposer onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText('Quick snippet'), {
      target: { value: 'dispatch-team' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert snippet' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Destination, ETA');
    expect(onAdd).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Destination *'), { target: { value: 'NODE_A' } });
    fireEvent.change(screen.getByLabelText('ETA *'), { target: { value: '75 menit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Insert snippet' }));

    const editor = screen.getByLabelText('Progress update');
    expect(editor).toHaveValue('Team dispatched to NODE_A, ETA 75 menit');
    expect(onAdd).not.toHaveBeenCalled();

    fireEvent.change(editor, {
      target: { value: 'Team dispatched to NODE_A, ETA 75 menit via jalur alternatif' },
    });
    expect(editor).toHaveValue('Team dispatched to NODE_A, ETA 75 menit via jalur alternatif');
  });

  it('stores favorite snippet ids browser-locally without auto-submitting Progress', () => {
    const onAdd = vi.fn();
    render(<ProgressComposer onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText('Quick snippet'), {
      target: { value: 'arrival-location' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Team arrived to favorites' }));

    expect(JSON.parse(window.localStorage.getItem(PROGRESS_SNIPPET_FAVORITES_STORAGE_KEY))).toEqual({
      version: 1,
      ids: ['arrival-location'],
    });
    expect(screen.getByText('1 local favorite')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
