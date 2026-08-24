import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button, ConfirmDialog, StatusBadge, TextInput } from './index.jsx';

afterEach(() => {
  cleanup();
});

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

  it('manages confirmation dialog focus and keyboard dismissal', () => {
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

    const dialog = screen.getByRole('dialog', { name: 'Resolve ticket?' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const resolve = screen.getByRole('button', { name: 'Resolve' });

    expect(dialog).toHaveAttribute('aria-describedby');
    expect(cancel).toHaveFocus();

    resolve.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(resolve);
    fireEvent.click(cancel);

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('supports disabled primary actions', () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
