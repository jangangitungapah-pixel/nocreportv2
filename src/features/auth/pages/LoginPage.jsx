import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { Button, TextInput } from '../../../shared/ui/index.jsx';

const localPreviewLinkClass =
  'mt-6 inline-flex min-h-[var(--control-height)] w-full items-center justify-center rounded-xl bg-[var(--accent-solid)] px-4 text-sm font-bold text-[var(--accent-on-solid)] shadow-[var(--shadow-accent)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-solid-hover)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)]';

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
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-4 text-[var(--text-primary)] md:p-6">
      <div
        className="pointer-events-none absolute -left-32 top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[var(--accent-glow)] blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)] blur-[110px]"
        aria-hidden="true"
      />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-lg)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--surface-inverse)] p-9 text-[var(--text-on-inverse)] lg:flex lg:flex-col lg:justify-between">
          <div
            className="spatial-dot-grid pointer-events-none absolute inset-0 opacity-[0.08]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-[#7278f5]/35 blur-[80px]"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#7278f5] text-xs font-black text-white shadow-[0_14px_34px_rgb(72_79_206/34%)]">
                NR
              </span>
              <div>
                <p className="font-[var(--font-display)] text-sm font-bold tracking-[-0.03em]">
                  NOC Report
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                  Operations workspace
                </p>
              </div>
            </div>

            <div className="mt-20 max-w-md">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#aeb2ff]">
                Incident clarity
              </p>
              <h2 className="mt-4 font-[var(--font-display)] text-[42px] font-bold leading-[1.02] tracking-[-0.055em]">
                Stay focused when the network gets noisy.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/58">
                One calm workspace for Ticket creation, progress, Cut Points, canonical reports, and
                operational follow-through.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-2.5">
            {[
              ['Fast', 'Report flow'],
              ['Local', 'Photo OCR'],
              ['Role-safe', 'Firebase'],
            ].map(([value, label]) => (
              <div
                key={value}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur"
              >
                <p className="text-sm font-bold text-white/90">{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/38">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[560px] items-center p-5 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center justify-between gap-4 lg:hidden">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-solid)] text-xs font-black text-[var(--accent-on-solid)] shadow-[var(--shadow-accent)]">
                  NR
                </span>
                <div>
                  <p className="text-sm font-bold">NOC Report</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Operations
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="spatial-kicker">Secure workspace</p>
              <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
                Welcome back.
              </h1>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                {firebaseConfigured
                  ? 'Sign in with an authorized Firebase account to access operational Ticket data.'
                  : 'Firebase is not configured in this local environment. You can continue in local preview mode without cloud persistence.'}
              </p>
            </div>

            {firebaseConfigured ? (
              <form className="mt-7 space-y-4" onSubmit={submit}>
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
                    className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-3.5 text-sm font-medium leading-6 text-[var(--danger-text)]"
                    role="alert"
                  >
                    {localError ||
                      'Your authenticated account does not have an active application profile.'}
                  </p>
                ) : null}
                <Button className="mt-1 w-full" type="submit" disabled={pending || loading}>
                  {pending || loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <Link to="/dashboard" className={localPreviewLinkClass}>
                Continue local preview
              </Link>
            )}

            <div className="mt-7 flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span className="h-px flex-1 bg-[var(--border-subtle)]" />
              <span className="font-semibold">NOC operations · production ready</span>
              <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
