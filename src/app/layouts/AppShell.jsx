import { Link, Outlet, useLocation } from 'react-router-dom';

import { BrandLockup, BrandMark } from '../../shared/brand/BrandIdentity.jsx';
import { Button, IconButton, UiIcon } from '../../shared/ui/index.jsx';
import { PRIMARY_NAVIGATION, isNavigationItemActive } from '../navigation.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useTheme } from '../providers/ThemeProvider.jsx';

function currentPageLabel(pathname) {
  if (pathname.startsWith('/generator')) return 'Template Generator';
  if (pathname.startsWith('/running')) return 'Running Ticket';
  if (pathname.startsWith('/cut-points')) return 'Cut Point Tracker';
  if (pathname.startsWith('/archive')) return 'Archive & Restore';
  return 'Dashboard';
}

function NavigationLink({ item }) {
  const location = useLocation();
  const active = isNavigationItemActive(location.pathname, item);

  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-12 select-none items-center gap-3 rounded-2xl border px-3.5 text-sm font-bold tracking-[-0.01em] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-[0.985] ${
        active
          ? 'border-[var(--border-accent)] bg-[var(--accent-soft)] text-[var(--accent-text)] shadow-[var(--shadow-xs)]'
          : 'border-transparent text-[var(--text-secondary)] hover:translate-x-0.5 hover:border-[var(--border-subtle)] hover:bg-[var(--surface-panel)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-xs)]'
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition duration-200 ${
          active
            ? 'border-[var(--border-accent)] bg-[var(--surface-panel)] text-[var(--accent-text)] shadow-[var(--shadow-xs)]'
            : 'border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-muted)] group-hover:bg-[var(--surface-panel)] group-hover:text-[var(--text-primary)]'
        }`}
        aria-hidden="true"
      >
        <UiIcon name={item.icon} size={16} />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-solid)]" aria-hidden="true" />
      ) : null}
    </Link>
  );
}

export function AppShell() {
  const location = useLocation();
  const { can, firebaseConfigured, localDevelopmentMode, profile, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pageLabel = currentPageLabel(location.pathname);
  const visibleNavigation = PRIMARY_NAVIGATION.filter(
    (item) => !item.requiredCapability || can(item.requiredCapability),
  );

  return (
    <div className="min-h-screen text-[var(--text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-3 backdrop-blur-2xl lg:flex lg:flex-col">
        <div className="flex min-h-[72px] items-center rounded-2xl px-3">
          <BrandLockup eager />
        </div>

        <div className="my-2 px-3">
          <div className="spatial-divider" />
        </div>

        <div className="px-3 pb-2 pt-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--text-faint)]">
            Workspace
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-1" aria-label="Primary navigation">
          {visibleNavigation.map((item) => (
            <NavigationLink key={item.key} item={item} />
          ))}
        </nav>

        <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-3.5 shadow-[var(--shadow-sm)]">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-xs font-extrabold text-[var(--accent-text)]">
                {localDevelopmentMode ? 'LD' : String(role || 'U').slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {localDevelopmentMode
                    ? 'Local development'
                    : profile?.displayName || profile?.email || 'Firebase user'}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  {localDevelopmentMode
                    ? 'Cloud writes are disabled in local preview.'
                    : `${role ?? 'UNKNOWN'} access · Firebase`}
                </p>
              </div>
            </div>
            {firebaseConfigured ? (
              <Button tone="secondary" className="mt-3 w-full" onClick={() => signOut()}>
                Sign out
              </Button>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 px-3 pt-3 md:px-5 lg:px-6">
          <div className="mx-auto flex min-h-[64px] w-full max-w-[var(--page-max)] items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] px-4 shadow-[var(--shadow-sm)] backdrop-blur-2xl md:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark size="xs" className="lg:hidden" eager />
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--accent-text)] lg:hidden">
                  NOC Report
                </p>
                <h1 className="truncate font-[var(--font-display)] text-lg font-bold tracking-[-0.035em] md:text-xl">
                  {pageLabel}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="spatial-chip hidden sm:inline-flex">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--success-solid)]"
                  aria-hidden="true"
                />
                {localDevelopmentMode ? 'Local preview' : (role ?? 'Authenticated')}
              </span>
              <IconButton
                label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                onClick={toggleTheme}
              >
                <UiIcon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
              </IconButton>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[var(--page-max)] px-4 pb-28 pt-5 md:px-6 md:pt-7 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-50 grid gap-1 rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)] backdrop-blur-2xl lg:hidden"
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
              className={`flex min-h-13 select-none flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-bold transition-[transform,background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-[0.94] ${
                active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-lg ${
                  active
                    ? 'bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]'
                    : 'bg-[var(--surface-muted)]'
                }`}
                aria-hidden="true"
              >
                <UiIcon name={item.icon} size={14} />
              </span>
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
