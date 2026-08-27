import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { BrandLockup, BrandMark } from '../../../shared/brand/BrandIdentity.jsx';
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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--surface-canvas)] p-3 text-[var(--text-primary)] sm:p-5">
      <div
        className="pointer-events-none absolute -left-24 top-[-9rem] h-[26rem] w-[26rem] rounded-full bg-[var(--accent-glow)] blur-[95px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 h-[24rem] w-[24rem] rounded-full bg-[color-mix(in_srgb,var(--accent-cyan)_10%,transparent)] blur-[105px]"
        aria-hidden="true"
      />

      <motion.section
        {...entranceProps}
        aria-labelledby="login-title"
        className="relative grid w-full max-w-[920px] overflow-hidden rounded-[var(--radius-dialog)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-lg)] lg:grid-cols-[0.88fr_1.12fr]"
      >
        <aside className="relative hidden min-h-[520px] overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--surface-inverse)] p-7 text-[var(--text-on-inverse)] lg:flex lg:flex-col lg:justify-between">
          <div
            className="spatial-dot-grid pointer-events-none absolute inset-0 opacity-[0.065]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full bg-[#7278f5]/28 blur-[82px]"
            aria-hidden="true"
          />

          <div className="relative">
            <BrandLockup inverse eager markSize="sm" />
            <div className="mt-12 max-w-[21rem]">
              <BrandMark
                size="lg"
                inverse
                eager
                className="mb-6 border-white/15 bg-white/[0.07] shadow-[0_20px_56px_rgb(0_0_0/26%)]"
              />
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#aeb2ff]">
                Operations clarity
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-[32px] font-bold leading-[1.06] tracking-[-0.045em]">
                One focused workspace for incident follow-through.
              </h2>
              <p className="mt-4 text-[13px] leading-6 text-white/58">
                Create, review, map, and close network Tickets without losing the safety boundaries
                around operational data.
              </p>
            </div>
          </div>

          <ul className="relative grid gap-2.5 text-[11px] font-semibold leading-5 text-white/62">
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

        <div className="flex min-h-[500px] items-center p-5 sm:p-7 lg:p-8">
          <div className="mx-auto w-full max-w-[390px]">
            <div className="lg:hidden">
              <BrandLockup compact eager subtitle="Operations" />
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-text)]">
                Secure workspace
              </p>
              <h1
                id="login-title"
                className="mt-2 font-[var(--font-display)] text-[30px] font-bold tracking-[-0.045em] sm:text-[34px]"
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
