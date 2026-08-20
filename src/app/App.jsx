export default function App() {
  return (
    <main className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <section className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            NOC Operations Workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            NOC Report Template Generator
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Repository foundation is ready for domain implementation. Product features are added in
            the tracked implementation phases.
          </p>
          <div
            className="mt-6 inline-flex rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-medium"
            aria-label="Current implementation phase"
          >
            T0 · Repository Foundation
          </div>
        </div>
      </section>
    </main>
  );
}
