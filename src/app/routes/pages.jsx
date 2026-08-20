import { Link } from 'react-router-dom';

import { EmptyState, StatusBadge } from '../../shared/ui/index.jsx';

const primaryLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent-solid)] px-4 text-sm font-semibold text-[var(--accent-on-solid)] transition hover:bg-[var(--accent-solid-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';

export function DashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[var(--text-muted)]">Operational overview</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Dashboard foundation</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {['Running Tickets', 'Tickets Today', 'With Coordinates', 'Recently Resolved'].map((label) => (
          <section
            key={label}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              {label}
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums">—</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Connected in Firebase phase</p>
          </section>
        ))}
      </div>
      <EmptyState
        title="No operational data connected yet"
        description="The responsive shell and design system are ready. Dashboard data arrives when the Firestore repository is connected."
        action={
          <Link to="/generator/new" className={primaryLinkClass}>
            Create report layout
          </Link>
        }
      />
    </div>
  );
}

export function RunningTicketsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">Active incidents</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Running Ticket</h2>
        </div>
        <StatusBadge status="RUNNING" />
      </div>
      <EmptyState
        title="No running tickets"
        description="Running incident rows and mobile ticket cards are connected in T5 after Firestore persistence is available."
      />
    </div>
  );
}

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

export function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface-canvas)] p-4 text-[var(--text-primary)]">
      <section className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-lg)]">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-solid)] text-xs font-black text-[var(--accent-on-solid)]">
          NR
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">NOC Report</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Firebase Authentication is introduced in T5. This route is the permanent authentication
          boundary.
        </p>
        <Link to="/dashboard" className={`mt-6 w-full ${primaryLinkClass}`}>
          Continue to development workspace
        </Link>
      </section>
    </main>
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
