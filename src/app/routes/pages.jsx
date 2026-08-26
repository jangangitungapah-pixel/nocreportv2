import { Link } from 'react-router-dom';

import { BrandLockup } from '../../shared/brand/BrandIdentity.jsx';
import { AppIcon } from '../../shared/ui/icon.jsx';
import { Button } from '../../shared/ui/primitives.jsx';

export function NotFoundPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--surface-canvas)] p-4 text-[var(--text-primary)]">
      <div
        className="pointer-events-none absolute -top-24 h-80 w-80 rounded-full bg-[var(--accent-glow)] blur-[90px]"
        aria-hidden="true"
      />
      <section className="relative w-full max-w-lg rounded-[var(--radius-dialog)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-md)] sm:p-6">
        <BrandLockup compact eager markSize="sm" subtitle="Route recovery" />
        <div className="mt-6 flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] border border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]"
            aria-hidden="true"
          >
            <AppIcon name="warning" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.035em]">
              Page not found
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
              The requested NOC workspace route does not exist or has moved. Return to the
              operational overview and continue from there.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end border-t border-[var(--border-subtle)] pt-4">
          <Button asChild size="touch">
            <Link to="/dashboard">
              <AppIcon name="dashboard" size={15} />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
