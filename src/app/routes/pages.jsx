import { Link } from 'react-router-dom';

import { EmptyState } from '../../shared/ui/index.jsx';

const primaryLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent-solid)] px-4 text-sm font-semibold text-[var(--accent-on-solid)] transition hover:bg-[var(--accent-solid-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';

export function CutPointTrackerPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[var(--text-muted)]">Geographic incident view</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Cut Point Tracker</h2>
      </div>
      <div className="grid min-h-[55vh] place-items-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-panel)] p-8 text-center">
        <div className="max-w-lg">
          <p className="text-base font-bold">Map module reserved</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Leaflet and the configurable tile source are loaded in T6 so the initial Dashboard bundle
            stays lean.
          </p>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface-canvas)] p-4 text-[var(--text-primary)]">
      <EmptyState
        title="Page not found"
        description="The requested NOC workspace route does not exist."
        action={
          <Link to="/dashboard" className={primaryLinkClass}>
            Back to Dashboard
          </Link>
        }
      />
    </main>
  );
}
