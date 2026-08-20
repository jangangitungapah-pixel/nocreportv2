import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../providers/AuthProvider.jsx';

export function ProtectedRoute() {
  const location = useLocation();
  const { firebaseConfigured, isAuthenticated, loading } = useAuth();

  if (firebaseConfigured && loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--surface-canvas)] p-6 text-[var(--text-primary)]">
        <p className="text-sm font-semibold text-[var(--text-secondary)]" role="status">
          Checking session…
        </p>
      </main>
    );
  }

  if (firebaseConfigured && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
