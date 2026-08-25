import { fireEvent, render, screen } from '@testing-library/react';
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
