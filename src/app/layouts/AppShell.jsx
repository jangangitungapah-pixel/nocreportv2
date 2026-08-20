import { Link, Outlet, useLocation } from 'react-router-dom';

import { PRIMARY_NAVIGATION, isNavigationItemActive } from '../navigation.js';
import { useTheme } from '../providers/ThemeProvider.jsx';
import { IconButton } from '../../shared/ui/index.jsx';

function currentPageLabel(pathname) {
  if (pathname.startsWith('/generator')) return 'Template Generator';
  if (pathname.startsWith('/running')) return 'Running Ticket';
  if (pathname.startsWith('/cut-points')) return 'Cut Point Tracker';
  return 'Dashboard';
}

function NavigationLink({ item }) {
  const location = useLocation();
  const active = isNavigationItemActive(location.pathname, item);

  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
        active
          ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-current/15 text-[11px] font-bold"
        aria-hidden="true"
      >
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const pageLabel = currentPageLabel(location.pathname);

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--border-subtle)] bg-[var(--surface-panel)] lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border-subtle)] px-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent-solid)] text-xs font-black text-[var(--accent-on-solid)]">
            NR
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">NOC Report</p>
            <p className="truncate text-xs text-[var(--text-muted)]">Operations Workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Primary navigation">
          {PRIMARY_NAVIGATION.map((item) => (
            <NavigationLink key={item.key} item={item} />
          ))}
        </nav>

        <div className="border-t border-[var(--border-subtle)] p-3">
          <div className="rounded-xl bg-[var(--surface-muted)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Workspace
            </p>
            <p className="mt-1 text-sm font-semibold">Development mode</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              Authentication boundary is prepared and will be enforced in the Firebase phase.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] px-4 backdrop-blur md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] lg:hidden">
              NOC Report
            </p>
            <h1 className="truncate text-lg font-bold tracking-tight">{pageLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-[var(--text-muted)] sm:inline">
              T2 · UI Foundation
            </span>
            <IconButton
              label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={toggleTheme}
            >
              <span aria-hidden="true">{theme === 'light' ? '◐' : '◑'}</span>
            </IconButton>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 pb-24 md:px-6 md:py-6 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden"
        aria-label="Mobile primary navigation"
      >
        {PRIMARY_NAVIGATION.map((item) => {
          const active = isNavigationItemActive(location.pathname, item);
          return (
            <Link
              key={item.key}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                active ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-black ${
                  active ? 'bg-[var(--accent-soft)]' : 'bg-[var(--surface-muted)]'
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
