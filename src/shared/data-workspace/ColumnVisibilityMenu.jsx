import { AppIcon } from '../ui/icon.jsx';
import {
  Button,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/primitives.jsx';

function columnLabel(column) {
  const metaLabel = column.columnDef?.meta?.label;
  if (typeof metaLabel === 'string' && metaLabel.trim()) return metaLabel;

  const header = column.columnDef?.header;
  if (typeof header === 'string' && header.trim()) return header;

  return column.id;
}

/**
 * UI-only visibility control for hideable leaf columns.
 *
 * This intentionally uses Radix Checkbox instead of menu check-items so the
 * chooser behaves like a small configuration surface: toggling several columns
 * keeps the popover open and does not blur the user's context.
 */
export function ColumnVisibilityMenu({
  table,
  label = 'Columns',
  align = 'end',
  className,
}) {
  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide());

  if (columns.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          tone="secondary"
          size="sm"
          className={className}
          aria-label="Choose visible columns"
        >
          <AppIcon name="columns" size={14} />
          <span>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-60 p-2">
        <div className="px-1.5 pb-1.5 pt-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Visible columns
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">
            Keep operational context dense by hiding secondary fields you do not need.
          </p>
        </div>

        <div className="mt-1 grid gap-0.5">
          {columns.map((column) => {
            const id = `column-visibility-${column.id}`;
            return (
              <label
                key={column.id}
                htmlFor={id}
                className="flex min-h-[var(--control-height-sm)] cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] px-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              >
                <Checkbox
                  id={id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(checked === true)}
                  aria-label={`Show ${columnLabel(column)} column`}
                />
                <span className="min-w-0 flex-1 truncate">{columnLabel(column)}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
