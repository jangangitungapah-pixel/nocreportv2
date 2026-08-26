import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { BrandLockup } from '../../shared/brand/BrandIdentity.jsx';
import { AppIcon } from '../../shared/ui/icon.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';

export function ProtectedRoute({ allowedRoles = null, children = null }) {
  const location = useLocation();
  const { firebaseConfigured, isAuthenticated, loading, localDevelopmentMode, role } = useAuth();

  if (firebaseConfigured && loading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--surface-canvas)] p-4 text-[var(--text-primary)]">
        <div
          className="pointer-events-none absolute h-64 w-64 rounded-full bg-[var(--accent-glow)] blur-[90px]"
          aria-hidden="true"
        />
        <div
          className="relative flex w-full max-w-sm items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 py-3.5 shadow-[var(--shadow-sm)]"
          aria-busy="true"
        >
          <BrandLockup compact eager markSize="sm" subtitle="Session check" className="flex-1" />
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--accent-text)]"
            aria-hidden="true"
          >
            <AppIcon name="refresh" size={16} className="animate-spin" />
          </span>
          <span className="sr-only" role="status" aria-live="polite">
            Checking session…
          </span>
        </div>
      </main>
    );
  }

  if (firebaseConfigured && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (
    !localDevelopmentMode &&
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    return <Navigate to="/dashboard" replace state={{ accessDenied: location.pathname }} />;
  }

  return children ?? <Outlet />;
}
