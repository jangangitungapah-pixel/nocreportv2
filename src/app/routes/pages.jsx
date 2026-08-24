import { Link } from 'react-router-dom';

import { EmptyState } from '../../shared/ui/index.jsx';

const primaryLinkClass =
  'inline-flex min-h-[var(--control-height)] items-center justify-center rounded-xl bg-[var(--accent-solid)] px-4 text-sm font-bold text-[var(--accent-on-solid)] shadow-[var(--shadow-accent)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-solid-hover)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)]';

export function NotFoundPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--surface-canvas)] p-4 text-[var(--text-primary)]">
      <div
        className="pointer-events-none absolute -top-24 h-96 w-96 rounded-full bg-[var(--accent-glow)] blur-[90px]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl">
        <EmptyState
          title="Page not found"
          description="The requested NOC workspace route does not exist or has moved. Return to the operational overview and continue from there."
          action={
            <Link to="/dashboard" className={primaryLinkClass}>
              Back to Dashboard
            </Link>
          }
        />
      </div>
    </main>
  );
}
