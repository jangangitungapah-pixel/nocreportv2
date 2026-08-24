import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { BrandLockup } from '../../shared/brand/BrandIdentity.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';

export function ProtectedRoute({ allowedRoles = null, children = null }) {
  const location = useLocation();
  const { firebaseConfigured, isAuthenticated, loading, localDevelopmentMode, role } = useAuth();

  if (firebaseConfigured && loading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--surface-canvas)] p-6 text-[var(--text-primary)]">
        <div
          className="pointer-events-none absolute h-72 w-72 rounded-full bg-[var(--accent-glow)] blur-[90px]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] px-8 py-7 text-center shadow-[var(--shadow-md)] backdrop-blur-2xl">
          <BrandLockup eager />
          <span
            className="mt-6 h-1.5 w-28 overflow-hidden rounded-full bg-[var(--surface-muted)]"
            aria-hidden="true"
          >
            <span className="block h-full w-1/2 animate-pulse rounded-full bg-[var(--accent-solid)]" />
          </span>
          <p className="mt-4 text-sm font-semibold text-[var(--text-secondary)]" role="status">
            Checking session…
          </p>
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
