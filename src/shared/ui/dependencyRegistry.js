import * as HookFormResolvers from '@hookform/resolvers';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import * as RadixDialog from '@radix-ui/react-dialog';
import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu';
import * as RadixPopover from '@radix-ui/react-popover';
import * as RadixScrollArea from '@radix-ui/react-scroll-area';
import * as RadixSeparator from '@radix-ui/react-separator';
import * as RadixSlot from '@radix-ui/react-slot';
import * as RadixSwitch from '@radix-ui/react-switch';
import * as RadixTabs from '@radix-ui/react-tabs';
import * as RadixToggleGroup from '@radix-ui/react-toggle-group';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import * as TanStackTable from '@tanstack/react-table';
import * as TanStackVirtual from '@tanstack/react-virtual';
import * as Cmdk from 'cmdk';
import * as MotionReact from 'motion/react';
import * as ResizablePanels from 'react-resizable-panels';
import * as Sonner from 'sonner';

/**
 * Migration-time capability registry for the Mega UI overhaul.
 *
 * These namespaces document the single intended owner for each interaction/workspace
 * concern before the page-level migration phases consume them. Keeping the registry
 * in application source also lets repository hygiene detect accidental dependency
 * drift while the staged migration is in progress.
 */
export const megaUiCapabilities = Object.freeze({
  formResolvers: HookFormResolvers,
  checkbox: RadixCheckbox,
  dialog: RadixDialog,
  dropdownMenu: RadixDropdownMenu,
  popover: RadixPopover,
  scrollArea: RadixScrollArea,
  separator: RadixSeparator,
  slot: RadixSlot,
  switch: RadixSwitch,
  tabs: RadixTabs,
  toggleGroup: RadixToggleGroup,
  tooltip: RadixTooltip,
  table: TanStackTable,
  virtual: TanStackVirtual,
  command: Cmdk,
  motion: MotionReact,
  resizablePanels: ResizablePanels,
  toast: Sonner,
});
