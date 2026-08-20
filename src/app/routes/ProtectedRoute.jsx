import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function ProtectedRoute({ enforce = false, isAuthenticated = true }) {
  const location = useLocation();

  if (enforce && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
