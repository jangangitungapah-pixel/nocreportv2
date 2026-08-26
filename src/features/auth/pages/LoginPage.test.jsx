import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { LoginPage } from './LoginPage.jsx';

const testState = vi.hoisted(() => ({
  auth: {},
  signIn: vi.fn(),
}));

vi.mock('motion/react', () => ({
  motion: { section: 'section' },
  useReducedMotion: () => true,
}));

vi.mock('../../../app/providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    error: null,
    firebaseConfigured: true,
    isAuthenticated: false,
    loading: false,
    signIn: testState.signIn,
    ...testState.auth,
  }),
}));

function renderPage(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<h1>Dashboard destination</h1>} />
        <Route path="/running" element={<h1>Running destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage edge-state contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.auth = {};
  });

  afterEach(() => {
    cleanup();
  });

  it('requires both credentials before calling Firebase sign in', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Email and password are required.');
    expect(testState.signIn).not.toHaveBeenCalled();
  });

  it('trims email and disables the form while sign in is pending', async () => {
    let resolveSignIn;
    testState.signIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    renderPage();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  noc@example.com  ' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(testState.signIn).toHaveBeenCalledWith('noc@example.com', 'secret');
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();

    resolveSignIn();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled());
  });

  it('surfaces the disabled-account error through the shared alert', async () => {
    testState.signIn.mockRejectedValue({ code: 'ACCOUNT_DISABLED' });
    renderPage();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'disabled@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This account is disabled.');
  });

  it('redirects an authenticated session back to the protected destination', async () => {
    testState.auth = { isAuthenticated: true };
    renderPage({ pathname: '/login', state: { from: '/running' } });

    expect(await screen.findByRole('heading', { name: 'Running destination' })).toBeInTheDocument();
  });

  it('keeps local preview explicit when Firebase is unavailable', () => {
    testState.auth = { firebaseConfigured: false };
    renderPage();

    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.getByText('Local preview')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue local preview' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });
});
