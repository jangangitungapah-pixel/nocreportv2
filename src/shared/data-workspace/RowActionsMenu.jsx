import { Fragment } from 'react';

import { AppIcon } from '../ui/icon.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/primitives.jsx';

/**
 * Canonical dense row-action pattern.
 *
 * Actions remain data supplied by the feature layer so this component never
 * decides Ticket capabilities or mutations. A feature can omit actions it is
 * not authorized to expose and the menu will simply not render them.
 */
export function RowActionsMenu({ actions, label = 'Open row actions', align = 'end' }) {
  const visibleActions = (actions ?? []).filter((action) => action && action.hidden !== true);

  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="grid h-[var(--control-height-sm)] w-[var(--control-height-sm)] place-items-center rounded-[var(--radius-control)] border border-transparent text-[var(--text-muted)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <AppIcon name="moreHorizontal" size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        {visibleActions.map((action, index) => (
          <Fragment key={action.key ?? action.label}>
            {action.separatorBefore && index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              danger={Boolean(action.danger)}
              disabled={Boolean(action.disabled)}
              onSelect={(event) => {
                if (action.disabled) return;
                action.onSelect?.(event);
              }}
            >
              {action.icon ? <AppIcon name={action.icon} size={14} /> : null}
              <span>{action.label}</span>
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
