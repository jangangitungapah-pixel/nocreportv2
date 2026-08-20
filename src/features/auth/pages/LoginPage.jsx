import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { Button, TextInput } from '../../../shared/ui/index.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: authError, firebaseConfigured, isAuthenticated, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState('');
  const destination = location.state?.from ?? '/dashboard';

  useEffect(() => {
    if (firebaseConfigured && !loading && isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [destination, firebaseConfigured, isAuthenticated, loading, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setLocalError('Email and password are required.');
      return;
    }

    setPending(true);
    setLocalError('');
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setLocalError(
        error?.code === 'ACCOUNT_DISABLED'
          ? 'This account is disabled.'
          : 'Sign in failed. Check the email/password and account access.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface-canvas)] p-4 text-[var(--text-primary)]">
      <section className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-lg)]">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-solid)] text-xs font-black text-[var(--accent-on-solid)]">
          NR
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">NOC Report</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {firebaseConfigured
            ? 'Sign in with an authorized Firebase account to access operational Ticket data.'
            : 'Firebase is not configured in this local environment. You can continue in local preview mode without cloud persistence.'}
        </p>

        {firebaseConfigured ? (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <TextInput
              id="login-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextInput
              id="login-password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {localError || authError ? (
              <p
                className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger-text)]"
                role="alert"
              >
                {localError ||
                  'Your authenticated account does not have an active application profile.'}
              </p>
            ) : null}
            <Button className="w-full" type="submit" disabled={pending || loading}>
              {pending || loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        ) : (
          <Link
            to="/dashboard"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--accent-solid)] px-4 text-sm font-semibold text-[var(--accent-on-solid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            Continue local preview
          </Link>
        )}
      </section>
    </main>
  );
}
