import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './primitives.jsx';

function ControlledDialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Archive Ticket
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Archive Ticket?</DialogTitle>
          <DialogDescription>Confirm the lifecycle mutation.</DialogDescription>
          <button type="button">Cancel</button>
        </DialogContent>
      </Dialog>
    </>
  );
}

describe('Mega Radix primitives', () => {
  it('supports Slot-powered button/link composition', () => {
    render(
      <Button asChild tone="secondary" size="sm">
        <a href="/tickets/demo">Review Ticket</a>
      </Button>,
    );

    expect(screen.getByRole('link', { name: 'Review Ticket' })).toHaveAttribute(
      'href',
      '/tickets/demo',
    );
  });

  it('renders an accessible controlled Dialog and closes on Escape', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Archive Ticket?</DialogTitle>
          <DialogDescription>Confirm the lifecycle mutation.</DialogDescription>
          <button type="button">Cancel</button>
        </DialogContent>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Archive Ticket?' });
    expect(dialog).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('restores focus for controlled Dialogs without a Radix trigger', () => {
    render(<ControlledDialogHarness />);

    const trigger = screen.getByRole('button', { name: 'Archive Ticket' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Archive Ticket?' });
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Archive Ticket?' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('provides semantic tabs and binary controls', () => {
    render(
      <>
        <Tabs defaultValue="running">
          <TabsList aria-label="Ticket view">
            <TabsTrigger value="running">Running</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          <TabsContent value="running">Running content</TabsContent>
          <TabsContent value="resolved">Resolved content</TabsContent>
        </Tabs>
        <Checkbox aria-label="Show coordinates" />
        <Switch aria-label="Compact rows" />
      </>,
    );

    expect(screen.getByRole('tab', { name: 'Running' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('checkbox', { name: 'Show coordinates' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Compact rows' })).toBeInTheDocument();
  });
});
