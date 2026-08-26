import { Command } from 'cmdk';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  dispatchGeneratorWorkspaceCommand,
  GENERATOR_WORKSPACE_COMMANDS,
  isGeneratorWorkspacePath,
} from '../../shared/lib/generatorWorkspaceCommands.js';
import { AppIcon } from '../../shared/ui/icon.jsx';
import { PRIMARY_NAVIGATION } from '../navigation.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useTheme } from '../providers/ThemeProvider.jsx';

function matchesPlatformShortcut(event) {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
}

const GENERATOR_COMMANDS = Object.freeze([
  Object.freeze({
    id: GENERATOR_WORKSPACE_COMMANDS.COPY_REPORT,
    label: 'Copy Report',
    icon: 'copy',
  }),
  Object.freeze({
    id: GENERATOR_WORKSPACE_COMMANDS.FOCUS_SMART_IMPORT,
    label: 'Focus Smart Import',
    icon: 'generator',
    newTicketOnly: true,
  }),
  Object.freeze({
    id: GENERATOR_WORKSPACE_COMMANDS.FOCUS_PROGRESS,
    label: 'Focus Progress',
    icon: 'plus',
  }),
  Object.freeze({
    id: GENERATOR_WORKSPACE_COMMANDS.FOCUS_VALIDATION,
    label: 'Validation Center',
    icon: 'info',
  }),
]);

export function CommandPalette({ open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const generatorWorkspace = isGeneratorWorkspacePath(location.pathname);
  const generatorCommands = generatorWorkspace
    ? GENERATOR_COMMANDS.filter(
        (item) => !item.newTicketOnly || location.pathname === '/generator/new',
      )
    : [];

  const navigationCommands = useMemo(
    () =>
      PRIMARY_NAVIGATION.filter((item) => !item.requiredCapability || can(item.requiredCapability)),
    [can],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!matchesPlatformShortcut(event)) return;
      event.preventDefault();
      setOpen(!open);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const run = (action) => {
    setOpen(false);
    action();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      contentClassName="fixed left-1/2 top-[18vh] z-[121] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[var(--radius-dialog)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-lg)] outline-none"
      overlayClassName="fixed inset-0 z-[120] bg-[var(--surface-scrim)] backdrop-blur-sm"
    >
      <div className="flex h-[var(--control-height-touch)] items-center gap-2 border-b border-[var(--border-subtle)] px-3">
        <AppIcon name="search" size={16} className="shrink-0 text-[var(--text-muted)]" />
        <Command.Input
          autoFocus
          placeholder="Search commands…"
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-faint)]"
        />
        <kbd className="rounded-[6px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
          Esc
        </kbd>
      </div>

      <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
        <Command.Empty className="px-3 py-8 text-center text-xs font-semibold text-[var(--text-muted)]">
          No command found.
        </Command.Empty>

        <Command.Group
          heading="Navigate"
          className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-[var(--text-faint)]"
        >
          {navigationCommands.map((item) => (
            <Command.Item
              key={item.key}
              value={`${item.label} ${item.shortLabel}`}
              onSelect={() => run(() => navigate(item.to))}
              className="flex min-h-[var(--control-height)] cursor-default select-none items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-sm font-semibold text-[var(--text-secondary)] outline-none data-[selected=true]:bg-[var(--surface-muted)] data-[selected=true]:text-[var(--text-primary)]"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--text-muted)]">
                <AppIcon name={item.icon} size={14} />
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Command.Item>
          ))}
        </Command.Group>

        {generatorCommands.length ? (
          <>
            <Command.Separator className="my-1 h-px bg-[var(--border-subtle)]" />
            <Command.Group
              heading="Generator"
              className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-[var(--text-faint)]"
            >
              {generatorCommands.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} Generator`}
                  onSelect={() => run(() => dispatchGeneratorWorkspaceCommand(item.id))}
                  className="flex min-h-[var(--control-height)] cursor-default select-none items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-sm font-semibold text-[var(--text-secondary)] outline-none data-[selected=true]:bg-[var(--surface-muted)] data-[selected=true]:text-[var(--text-primary)]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--text-muted)]">
                    <AppIcon name={item.icon} size={14} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </>
        ) : null}

        <Command.Separator className="my-1 h-px bg-[var(--border-subtle)]" />

        <Command.Group
          heading="Workspace"
          className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-[var(--text-faint)]"
        >
          <Command.Item
            value={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            onSelect={() => run(toggleTheme)}
            className="flex min-h-[var(--control-height)] cursor-default select-none items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-sm font-semibold text-[var(--text-secondary)] outline-none data-[selected=true]:bg-[var(--surface-muted)] data-[selected=true]:text-[var(--text-primary)]"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--text-muted)]">
              <AppIcon name={theme === 'light' ? 'moon' : 'sun'} size={14} />
            </span>
            <span>Switch to {theme === 'light' ? 'dark' : 'light'} mode</span>
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
