import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProgressComposer } from './ProgressComposer.jsx';

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

function selectQuickSnippet(optionName) {
  fireEvent.click(screen.getByRole('combobox', { name: 'Quick snippet' }));
  fireEvent.click(screen.getByRole('option', { name: optionName }));
}

describe('ProgressComposer Operator Preset controls', () => {
  it('supports a blank event-time default without inventing a timestamp', () => {
    render(<ProgressComposer onAdd={vi.fn()} eventTimeBehavior="blank" />);

    expect(screen.getByLabelText('Event time')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('Progress update'), {
      target: { value: 'Operator entered text first' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add update' }));
    expect(screen.getByText('Progress time is required.')).toBeInTheDocument();
  });

  it('uses controlled favorite ids and reports explicit favorite changes to the preset owner', () => {
    const onFavoriteSnippetIdsChange = vi.fn();
    render(
      <ProgressComposer
        onAdd={vi.fn()}
        favoriteSnippetIds={['arrival-location']}
        onFavoriteSnippetIdsChange={onFavoriteSnippetIdsChange}
      />,
    );

    expect(screen.getByText('1 local favorite')).toBeInTheDocument();
    selectQuickSnippet('★ [Arrival] Team arrived');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Team arrived from favorites' }));

    expect(onFavoriteSnippetIdsChange).toHaveBeenCalledWith([]);
  });
});
