import { Link } from 'react-router-dom';

import { EmptyState } from '../../shared/ui/index.jsx';

const primaryLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent-solid)] px-4 text-sm font-semibold text-[var(--accent-on-solid)] transition hover:bg-[var(--accent-solid-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';

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
