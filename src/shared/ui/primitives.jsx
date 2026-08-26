import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { Slot } from '@radix-ui/react-slot';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef, useRef } from 'react';

import { cn } from '../lib/cn.js';
import { AppIcon } from './icon.jsx';
import { buttonVariants } from './variants.js';

export const Button = forwardRef(function Button(
  { asChild = false, tone, size, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'button';
  const type = asChild ? undefined : (props.type ?? 'button');
  return (
    <Component
      ref={ref}
      type={type}
      className={cn(buttonVariants({ tone, size }), className)}
      {...props}
    />
  );
});

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DialogOverlay = forwardRef(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'ui-dialog-backdrop fixed inset-0 z-[90] bg-[var(--surface-scrim)] backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
});

export const DialogContent = forwardRef(function DialogContent(
  { className, children, showClose = false, onOpenAutoFocus, onCloseAutoFocus, ...props },
  ref,
) {
  const restoreFocusRef = useRef(null);

  const handleOpenAutoFocus = (event) => {
    restoreFocusRef.current = document.activeElement;
    onOpenAutoFocus?.(event);
  };

  const handleCloseAutoFocus = (event) => {
    onCloseAutoFocus?.(event);
    if (event.defaultPrevented) return;

    const restoreTarget = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (restoreTarget?.focus && restoreTarget?.isConnected !== false) {
      event.preventDefault();
      restoreTarget.focus();
    }
  };

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'ui-dialog fixed left-1/2 top-1/2 z-[91] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-dialog)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-lg)] outline-none md:p-5',
          className,
        )}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            aria-label="Close dialog"
            className="absolute right-3 top-3 grid h-[var(--control-height-sm)] w-[var(--control-height-sm)] place-items-center rounded-[var(--radius-control)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <AppIcon name="close" size={16} />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuLabel = DropdownMenuPrimitive.Label;

export const DropdownMenuContent = forwardRef(function DropdownMenuContent(
  { className, sideOffset = 6, ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'ui-select-popover z-[95] min-w-44 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1 shadow-[var(--shadow-md)] outline-none',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

export const DropdownMenuItem = forwardRef(function DropdownMenuItem(
  { className, danger = false, inset = false, ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'flex min-h-[var(--control-height-sm)] select-none items-center gap-2 rounded-[var(--radius-control)] px-2.5 text-xs font-semibold outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-[var(--surface-muted)]',
        danger
          ? 'text-[var(--danger-text)] data-[highlighted]:bg-[var(--danger-soft)]'
          : 'text-[var(--text-secondary)] data-[highlighted]:text-[var(--text-primary)]',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = forwardRef(function DropdownMenuSeparator(
  { className, ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('my-1 h-px bg-[var(--border-subtle)]', className)}
      {...props}
    />
  );
});

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export const PopoverContent = forwardRef(function PopoverContent(
  { className, align = 'center', sideOffset = 6, ...props },
  ref,
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'ui-select-popover z-[95] rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-[var(--text-primary)] shadow-[var(--shadow-md)] outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef(function TooltipContent(
  { className, sideOffset = 6, ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-[110] max-w-64 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-inverse)] px-2.5 py-1.5 text-[11px] font-semibold leading-4 text-[var(--text-on-inverse)] shadow-[var(--shadow-md)]',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex min-h-[var(--control-height)] items-center gap-0.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-0.5',
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'min-h-[calc(var(--control-height)-6px)] rounded-[6px] px-3 text-xs font-bold text-[var(--text-muted)] outline-none transition-colors hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=active]:bg-[var(--surface-panel)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-xs)]',
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
        className,
      )}
      {...props}
    />
  );
});

export const ScrollArea = forwardRef(function ScrollArea({ className, children, ...props }, ref) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none p-px"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-[var(--scrollbar-thumb)] before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-8 before:w-full before:min-w-8 before:-translate-x-1/2 before:-translate-y-1/2" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar
        orientation="horizontal"
        className="flex h-2 touch-none select-none flex-col p-px"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-[var(--scrollbar-thumb)] before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-8 before:w-full before:min-w-8 before:-translate-x-1/2 before:-translate-y-1/2" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner className="bg-transparent" />
    </ScrollAreaPrimitive.Root>
  );
});

export const Separator = forwardRef(function Separator(
  { className, orientation = 'horizontal', decorative = true, ...props },
  ref,
) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-[var(--border-subtle)]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
});

export const Checkbox = forwardRef(function Checkbox({ className, children, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'grid h-4.5 w-4.5 shrink-0 place-items-center rounded-[5px] border border-[var(--border-default)] bg-[var(--surface-panel)] text-[var(--accent-on-solid)] outline-none transition-colors hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=checked]:border-[var(--accent-solid)] data-[state=checked]:bg-[var(--accent-solid)] disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <AppIcon name="check" size={12} strokeWidth={2.4} />
      </CheckboxPrimitive.Indicator>
      {children}
    </CheckboxPrimitive.Root>
  );
});

export const Switch = forwardRef(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-5.5 w-9 shrink-0 rounded-full bg-[var(--surface-muted-strong)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=checked]:bg-[var(--accent-solid)] disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-4.5 w-4.5 translate-x-0.5 rounded-full bg-white shadow-[var(--shadow-xs)] transition-transform data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
});

export const ToggleGroup = forwardRef(function ToggleGroup({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-0.5',
        className,
      )}
      {...props}
    />
  );
});

export const ToggleGroupItem = forwardRef(function ToggleGroupItem({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        'min-h-[calc(var(--control-height)-6px)] rounded-[6px] px-2.5 text-xs font-bold text-[var(--text-muted)] outline-none transition-colors hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=on]:bg-[var(--surface-panel)] data-[state=on]:text-[var(--accent-text)] data-[state=on]:shadow-[var(--shadow-xs)] disabled:opacity-45',
        className,
      )}
      {...props}
    />
  );
});
