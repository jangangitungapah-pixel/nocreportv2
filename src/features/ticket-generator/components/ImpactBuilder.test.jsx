import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImpactBuilder } from './ImpactBuilder.jsx';

afterEach(() => cleanup());

describe('GEN-F3 ImpactBuilder', () => {
  it('previews normalized candidates, filters duplicates and applies only selected items', () => {
    const onApply = vi.fn();
    render(<ImpactBuilder existing={[{ value: 'SITE_EXISTING' }]} onApply={onApply} />);

    const source = screen.getByLabelText('Paste impact / service / node list');
    fireEvent.change(source, {
      target: {
        value: '1. SITE_EXISTING\n- SITE_NEW\n• SERVICE_B\nsite_new',
      },
    });

    expect(screen.queryByText('SITE_EXISTING')).not.toBeInTheDocument();
    expect(screen.getByText('SITE_NEW')).toBeInTheDocument();
    expect(screen.getByText('SERVICE_B')).toBeInTheDocument();
    expect(screen.getByText(/2 duplicate skipped/)).toBeInTheDocument();

    const serviceCheckbox = screen.getByText('SERVICE_B').closest('label').querySelector('input');
    fireEvent.click(serviceCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'Apply selected (1)' }));

    expect(onApply).toHaveBeenCalledWith(['SITE_NEW']);
    expect(source).toHaveValue('');
  });

  it('does not apply anything until the operator explicitly selects and confirms', () => {
    const onApply = vi.fn();
    render(<ImpactBuilder onApply={onApply} />);

    fireEvent.change(screen.getByLabelText('Paste impact / service / node list'), {
      target: { value: 'SITE_A' },
    });
    const checkbox = screen.getByText('SITE_A').closest('label').querySelector('input');
    fireEvent.click(checkbox);

    expect(screen.getByRole('button', { name: 'Apply selected (0)' })).toBeDisabled();
    expect(onApply).not.toHaveBeenCalled();
  });
});
