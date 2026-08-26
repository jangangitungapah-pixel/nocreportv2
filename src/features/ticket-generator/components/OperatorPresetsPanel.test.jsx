import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_OPERATOR_PRESETS } from '../lib/operatorPresets.js';
import { OperatorPresetsPanel } from './OperatorPresetsPanel.jsx';

function presets(overrides = {}) {
  return {
    ...DEFAULT_OPERATOR_PRESETS,
    favoriteProgressSnippetIds: ['dispatch-team'],
    utilityState: { ...DEFAULT_OPERATOR_PRESETS.utilityState, presetsExpanded: true },
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('OperatorPresetsPanel', () => {
  it('edits only operator preference values and reports utility-state changes', () => {
    const onChange = vi.fn();
    render(<OperatorPresetsPanel presets={presets()} expanded onChange={onChange} />);

    expect(screen.getByText('1 favorite snippet')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Default PIC for new Tickets'), {
      target: { value: 'Team Majalengka' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ defaultPic: 'Team Majalengka' }),
    );

    fireEvent.click(screen.getByLabelText('Copy Center expanded by default'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        utilityState: expect.objectContaining({ copyCenterExpanded: false }),
      }),
    );
  });

  it('keeps reset explicit and never exposes role or permission controls', () => {
    const onReset = vi.fn();
    render(<OperatorPresetsPanel presets={presets()} expanded onReset={onReset} />);

    expect(screen.queryByText(/permission/i)).toHaveTextContent('Browser-local only · no role or permission state');
    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
