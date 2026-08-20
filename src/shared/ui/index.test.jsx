import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button, ConfirmDialog, StatusBadge, TextInput } from './index.jsx';

describe('shared UI primitives', () => {
  it('associates validation feedback with its input', () => {
    render(<TextInput id="title" label="Title" error="Title is required" />);

    const input = screen.getByRole('textbox', { name: /Title/ });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'title-error');
    expect(screen.getByText('Title is required')).toHaveAttribute('id', 'title-error');
  });

  it('renders ticket status with readable text', () => {
    render(<StatusBadge status="RUNNING" />);

    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('keeps confirmation actions as proper buttons', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Resolve ticket?"
        description="This moves the ticket out of the running list."
        confirmLabel="Resolve"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Resolve ticket?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('supports disabled primary actions', () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
