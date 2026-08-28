import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { BrandLockup } from '../../../shared/brand/BrandIdentity.jsx';
import { popIn } from '../../../shared/motion/index.js';
import { InlineAlert } from '../../../shared/ui/InlineAlert.jsx';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { TextInput } from '../../../shared/ui/index.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';

const PRODUCT_POINTS = [
  'Canonical Ticket reporting and lifecycle review',
  'Browser-local OCR and verified Cut Point workflow',
  'Capability-safe Admin, Operator, and Viewer access',
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
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

  const entranceProps = reduceMotion ? {} : popIn;

  return (
    <main className="login-page relative grid min-h-screen place-items-center overflow-hidden bg-[var(--surface-canvas)] p-3 text-[var(--text-primary)] sm:p-5">
      <motion.section
        {...entranceProps}
        aria-labelledby="login-title"
        className="login-shell relative grid w-full max-w-[900px] overflow-hidden rounded-[var(--radius-dialog)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-lg)] lg:grid-cols-[0.86fr_1.14fr]"
      >
        <aside className="login-story relative hidden min-h-[500px] overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--surface-inverse)] p-7 text-[var(--text-on-inverse)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <BrandLockup inverse eager markSize="sm" />
            <div className="login-story__copy mt-14 max-w-[20rem]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#b9b8ff]">
                Operations clarity
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-[27px] font-semibold leading-[1.12] tracking-[-0.04em]">
                One focused workspace for incident follow-through.
              </h2>
              <p className="mt-4 text-[12px] leading-5 text-white/58">
                Create, review, map, and close network Tickets without losing the safety boundaries
                around operational data.
              </p>
            </div>
          </div>

          <ul className="login-story__points grid gap-2.5 text-[11px] font-medium leading-5 text-white/62">
            {PRODUCT_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/[0.08] text-[#c6c9ff]">
                  <AppIcon name="check" size={12} />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="login-form-panel flex min-h-[500px] items-center p-5 sm:p-7 lg:p-8">
          <div className="mx-auto w-full max-w-[390px]">
            <div className="lg:hidden">
              <BrandLockup compact eager subtitle="Operations" />
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)]">
                Secure workspace
              </p>
              <h1
                id="login-title"
                className="mt-2 font-[var(--font-display)] text-[28px] font-semibold tracking-[-0.045em] sm:text-[30px]"
              >
                Welcome back.
              </h1>
              <p className="mt-2.5 text-[13px] leading-6 text-[var(--text-secondary)]">
                {firebaseConfigured
                  ? 'Sign in with an authorized Firebase account to continue to NOC operations.'
                  : 'Firebase is unavailable in this environment. Continue with local preview without cloud persistence.'}
              </p>
            </div>

            {firebaseConfigured ? (
              <form className="mt-6 grid gap-3.5" onSubmit={submit}>
                <TextInput
                  id="login-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={pending || loading}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <TextInput
                  id="login-password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={pending || loading}
                  onChange={(event) => setPassword(event.target.value)}
                />

                {localError || authError ? (
                  <InlineAlert tone="danger" role="alert" title="Sign in unavailable">
                    {localError ||
                      'Your authenticated account does not have an active application profile.'}
                  </InlineAlert>
                ) : null}

                <Button
                  className="mt-0.5 w-full"
                  size="touch"
                  type="submit"
                  disabled={pending || loading}
                >
                  {pending || loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <div className="mt-6 grid gap-3">
                <InlineAlert tone="info" title="Local preview">
                  Cloud reads and lifecycle mutations stay disabled until Firebase configuration is
                  available.
                </InlineAlert>
                <Button asChild size="touch" className="w-full">
                  <Link to="/dashboard">Continue local preview</Link>
                </Button>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3 text-[10.5px] text-[var(--text-muted)]">
              <span className="h-px flex-1 bg-[var(--border-subtle)]" />
              <span className="font-semibold">NOC Report · secure operations</span>
              <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
