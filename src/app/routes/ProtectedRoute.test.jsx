import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { ProtectedRoute } from './ProtectedRoute.jsx';

const testState = vi.hoisted(() => ({
  auth: {},
}));

vi.mock('../providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    firebaseConfigured: true,
    isAuthenticated: true,
    loading: false,
    localDevelopmentMode: false,
    role: 'ADMIN',
    ...testState.auth,
  }),
}));

function LoginProbe() {
  const location = useLocation();
  return <p>Login from {location.state?.from ?? 'unknown'}</p>;
}

function renderProtected({ allowedRoles = null, initialEntry = '/running' } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route path="/dashboard" element={<p>Dashboard redirect</p>} />
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/running" element={<p>Protected content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute edge-state contracts', () => {
  beforeEach(() => {
    testState.auth = {};
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the compact branded session state while Firebase auth is loading', () => {
    testState.auth = { loading: true };
    renderProtected();

    expect(screen.getByRole('status')).toHaveTextContent('Checking session…');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to Login and preserves the requested path', async () => {
    testState.auth = { isAuthenticated: false };
    renderProtected();

    expect(await screen.findByText('Login from /running')).toBeInTheDocument();
  });

  it('keeps role restrictions capability-safe after the loading presentation cleanup', async () => {
    testState.auth = { role: 'VIEWER' };
    renderProtected({ allowedRoles: ['ADMIN'] });

    expect(await screen.findByText('Dashboard redirect')).toBeInTheDocument();
  });

  it('keeps local preview able to enter protected presentation routes', () => {
    testState.auth = {
      firebaseConfigured: false,
      isAuthenticated: true,
      localDevelopmentMode: true,
      role: 'LOCAL_DEV',
    };
    renderProtected({ allowedRoles: ['ADMIN'] });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
