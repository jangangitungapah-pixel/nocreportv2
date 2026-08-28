import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { BrandLockup, BrandMark } from '../../shared/brand/BrandIdentity.jsx';
import {
  TICKET_WORKSPACE_SCOPE,
  subscribeTicketWorkspaceChanges,
} from '../../shared/integration/ticketWorkspaceSync.js';
import { AppIcon } from '../../shared/ui/icon.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../shared/ui/primitives.jsx';
import { CommandPalette } from '../components/CommandPalette.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { PRIMARY_NAVIGATION, isNavigationItemActive } from '../navigation.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useTheme } from '../providers/ThemeProvider.jsx';

function NavigationLink({ item }) {
  const location = useLocation();
  const active = isNavigationItemActive(location.pathname, item);

  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-[38px] select-none items-center gap-2 rounded-[var(--radius-control)] border px-2.5 text-xs font-bold tracking-[-0.01em] transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
        active
          ? 'border-[var(--border-accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
          : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-[7px] ${
          active ? 'bg-[var(--surface-panel)]' : 'text-[var(--text-muted)]'
        }`}
        aria-hidden="true"
      >
        <AppIcon name={item.icon} size={15} />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-solid)]" aria-hidden="true" />
      ) : null}
    </Link>
  );
}

function ticketWorkspaceSubscription(pathname) {
  if (pathname.startsWith('/dashboard')) {
    return { scope: TICKET_WORKSPACE_SCOPE.DASHBOARD, ticketId: null };
  }
  if (pathname.startsWith('/running')) {
    return { scope: TICKET_WORKSPACE_SCOPE.RUNNING, ticketId: null };
  }
  if (pathname.startsWith('/cut-points')) {
    return { scope: TICKET_WORKSPACE_SCOPE.CUT_POINTS, ticketId: null };
  }
  if (pathname.startsWith('/archive')) {
    return { scope: TICKET_WORKSPACE_SCOPE.ARCHIVE, ticketId: null };
  }
  if (pathname.startsWith('/tickets/')) {
    const ticketId = pathname.split('/')[2];
    return {
      scope: TICKET_WORKSPACE_SCOPE.TICKET,
      ticketId: ticketId ? decodeURIComponent(ticketId) : null,
    };
  }
  return null;
}

export function AppShell() {
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const { can, firebaseConfigured, localDevelopmentMode, profile, role, signOut } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const visibleNavigation = PRIMARY_NAVIGATION.filter(
    (item) => !item.requiredCapability || can(item.requiredCapability),
  );
  const accountLabel = localDevelopmentMode
    ? 'Local development'
    : profile?.displayName || profile?.email || 'Firebase user';
  const workspaceSubscription = useMemo(
    () => ticketWorkspaceSubscription(location.pathname),
    [location.pathname],
  );
  const workspaceScope = workspaceSubscription?.scope ?? null;
  const workspaceTicketId = workspaceSubscription?.ticketId ?? null;

  useEffect(() => {
    if (!workspaceScope || localDevelopmentMode) return undefined;
    return subscribeTicketWorkspaceChanges(
      () => setWorkspaceRevision((current) => current + 1),
      {
        scopes: [workspaceScope],
        ticketId: workspaceTicketId,
        debounceMs: 160,
        ignoreCurrentSource: true,
      },
    );
  }, [localDevelopmentMode, workspaceScope, workspaceTicketId]);

  return (
    <TooltipProvider delayDuration={350}>
      <div className="min-h-screen text-[var(--text-primary)]">
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] border-r border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-2.5 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="flex min-h-[52px] items-center px-2">
            <BrandLockup eager />
          </div>

          <Separator className="my-1.5" />

          <div className="px-2 pb-1.5 pt-2">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--text-faint)]">
              Workspace
            </p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Primary navigation">
            {visibleNavigation.map((item) => (
              <NavigationLink key={item.key} item={item} />
            ))}
          </nav>

          <div className="mt-2 border-t border-[var(--border-subtle)] pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-control)] px-2 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  aria-label="Open account menu"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-[var(--accent-soft)] text-[10px] font-extrabold text-[var(--accent-text)]">
                    {localDevelopmentMode ? 'LD' : String(role || 'U').slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">{accountLabel}</span>
                    <span className="block truncate text-[10px] font-semibold text-[var(--text-muted)]">
                      {localDevelopmentMode ? 'Local preview' : `${role ?? 'UNKNOWN'} · Firebase`}
                    </span>
                  </span>
                  <AppIcon name="arrowUp" size={13} className="text-[var(--text-faint)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[222px]">
                <DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  Account
                </DropdownMenuLabel>
                <div className="flex min-h-[var(--control-height)] items-center justify-between gap-3 px-2.5 py-1.5">
                  <span className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                    <AppIcon name="moon" size={14} />
                    Dark mode
                  </span>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    aria-label="Dark mode"
                  />
                </div>
                {firebaseConfigured ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem danger onSelect={() => signOut()}>
                      Sign out
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        <div className="lg:pl-[244px]">
          <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] backdrop-blur-2xl">
            <div className="mx-auto flex min-h-[50px] w-full max-w-[var(--page-max)] items-center justify-between gap-3 px-3 md:px-4 lg:px-5">
              <PageHeader
                variant="shell"
                leading={<BrandMark size="xs" className="lg:hidden" eager />}
              />

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="hidden items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] sm:flex">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[var(--success-solid)]"
                    aria-hidden="true"
                  />
                  {localDevelopmentMode ? 'Local preview' : (role ?? 'Authenticated')}
                </span>

                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="hidden min-h-[34px] items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] md:flex"
                  aria-label="Open command palette"
                >
                  <AppIcon name="search" size={14} />
                  <span>Commands</span>
                  <kbd className="rounded-[5px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">
                    Ctrl K
                  </kbd>
                </button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                      onClick={toggleTheme}
                      className="grid h-[34px] w-[34px] place-items-center rounded-[var(--radius-control)] border border-transparent text-[var(--text-muted)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <AppIcon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Switch to {theme === 'light' ? 'dark' : 'light'} mode
                  </TooltipContent>
                </Tooltip>

                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="grid h-[34px] w-[34px] place-items-center rounded-[var(--radius-control)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] md:hidden"
                  aria-label="Open command palette"
                >
                  <AppIcon name="search" size={16} />
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[var(--page-max)] px-3 pb-24 pt-3 md:px-4 md:pt-4 lg:px-5 lg:pb-8">
            <Outlet key={`${location.pathname}:${workspaceRevision}`} />
          </main>
        </div>

        <nav
          className="fixed inset-x-2 bottom-2 z-50 grid gap-0.5 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)] backdrop-blur-2xl lg:hidden"
          style={{ gridTemplateColumns: `repeat(${visibleNavigation.length}, minmax(0, 1fr))` }}
          aria-label="Mobile primary navigation"
        >
          {visibleNavigation.map((item) => {
            const active = isNavigationItemActive(location.pathname, item);
            return (
              <Link
                key={item.key}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] select-none flex-col items-center justify-center gap-0.5 rounded-[10px] px-1 py-1 text-[9px] font-bold transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <AppIcon name={item.icon} size={15} />
                <span className="max-w-full truncate">{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}
