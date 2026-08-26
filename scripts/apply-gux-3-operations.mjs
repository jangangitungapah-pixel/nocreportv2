import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const mode = process.argv[2] ?? 'apply';

function replaceRequired(text, from, to, label) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw new Error(`GUX-3 marker not found: ${label}`);
  return text.replace(from, to);
}

function patchEvidenceWorkspace() {
  const path = 'src/features/ticket-generator/components/EvidenceWorkspace.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      'className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)]"',
      'className="generator-evidence-card overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)]"',
      'evidence card',
    ],
    [
      'className={`rounded-full border px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.08em] ${',
      'className={`generator-evidence-state-badge rounded-full border px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.08em] ${',
      'evidence state badge',
    ],
    [
      '<div className="border-t border-[var(--border-subtle)] px-3 py-2" aria-live="polite">',
      '<div className="generator-evidence-scan border-t border-[var(--border-subtle)] px-3 py-2" aria-live="polite">',
      'evidence scan state',
    ],
    [
      '<div className="border-t border-[var(--border-subtle)] bg-[var(--accent-soft)] p-3">',
      '<div className="generator-evidence-review border-t border-[var(--border-subtle)] bg-[var(--accent-soft)] p-3">',
      'evidence OCR review',
    ],
    [
      '<div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-3 py-2">',
      '<div className="generator-evidence-selected flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-3 py-2">',
      'evidence selected coordinate',
    ],
    [
      'className="generator-evidence-workspace overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-operations-surface generator-evidence-workspace overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'evidence workspace surface',
    ],
    [
      '<header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      '<header className="generator-operations-header generator-evidence-workspace__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      'evidence workspace header',
    ],
    [
      '<div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2.5">',
      '<div className="generator-evidence-dropzone flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2.5">',
      'evidence dropzone',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchCoordinateExtractor() {
  const path = 'src/features/ticket-generator/components/CoordinateExtractor.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      'className="flex min-h-10 w-full items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-3 py-2 text-left transition-colors first:border-t-0 hover:bg-[var(--surface-panel-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"',
      'className="generator-ocr-candidate flex min-h-10 w-full items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-3 py-2 text-left transition-colors first:border-t-0 hover:bg-[var(--surface-panel-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"',
      'OCR candidate',
    ],
    [
      '<section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      '<section className="generator-operations-surface generator-coordinate-extractor overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      'coordinate extractor surface',
    ],
    [
      '<header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3">',
      '<header className="generator-operations-header generator-coordinate-extractor__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3">',
      'coordinate extractor header',
    ],
    [
      'className={`grid gap-3 border border-dashed p-2.5 transition-colors sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center ${',
      'className={`generator-ocr-dropzone grid gap-3 border border-dashed p-2.5 transition-colors sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center ${',
      'OCR dropzone',
    ],
    [
      'className="mt-2.5 border-l-2 border-[var(--accent-solid)] px-2.5 py-1.5"',
      'className="generator-ocr-progress mt-2.5 border-l-2 border-[var(--accent-solid)] px-2.5 py-1.5"',
      'OCR progress',
    ],
    [
      '<div className="mt-2.5 overflow-hidden border border-[var(--border-accent)] bg-[var(--accent-soft)]">',
      '<div className="generator-ocr-result generator-ocr-result--detected mt-2.5 overflow-hidden border border-[var(--border-accent)] bg-[var(--accent-soft)]">',
      'OCR detected result',
    ],
    [
      '<div className="mt-2.5 overflow-hidden border border-[var(--warning-border)] bg-[var(--warning-soft)]">',
      '<div className="generator-ocr-result generator-ocr-result--ambiguous mt-2.5 overflow-hidden border border-[var(--warning-border)] bg-[var(--warning-soft)]">',
      'OCR ambiguous result',
    ],
    [
      '<details className="mt-2.5 border-t border-[var(--border-subtle)] pt-2.5">',
      '<details className="generator-ocr-details mt-2.5 border-t border-[var(--border-subtle)] pt-2.5">',
      'OCR text details',
    ],
    [
      '<details className="mt-2 border-t border-[var(--border-subtle)] pt-2">',
      '<details className="generator-ocr-details mt-2 border-t border-[var(--border-subtle)] pt-2">',
      'OCR attempts details',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchProgressComposer() {
  const path = 'src/features/ticket-generator/components/ProgressComposer.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      'className="generator-progress-composer overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-operations-surface generator-progress-composer overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'progress composer surface',
    ],
    [
      '<header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">',
      '<header className="generator-operations-header generator-progress-composer__header flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">',
      'progress composer header',
    ],
    [
      '<div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">',
      '<div className="generator-progress-snippet-deck border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">',
      'progress snippet deck',
    ],
    [
      '<div className="grid gap-2.5 p-3 lg:grid-cols-[190px_minmax(0,1fr)_auto] lg:items-end">',
      '<div className="generator-progress-compose-grid grid gap-2.5 p-3 lg:grid-cols-[190px_minmax(0,1fr)_auto] lg:items-end">',
      'progress compose grid',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchProgressTimeline() {
  const path = 'src/features/ticket-generator/components/ProgressTimeline.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      'className="generator-progress-empty rounded-[var(--radius-panel)] border border-dashed border-[var(--border-default)] bg-[var(--surface-panel)] px-3 py-3 text-xs font-medium text-[var(--text-muted)]"',
      'className="generator-operations-empty generator-progress-empty rounded-[var(--radius-panel)] border border-dashed border-[var(--border-default)] bg-[var(--surface-panel)] px-3 py-3 text-xs font-medium text-[var(--text-muted)]"',
      'progress empty state',
    ],
    [
      '<section className="generator-progress-history overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      '<section className="generator-operations-surface generator-progress-history overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      'progress history surface',
    ],
    [
      '<header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">',
      '<header className="generator-operations-header generator-progress-history__header flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">',
      'progress history header',
    ],
    [
      '<div className="bg-[var(--surface-muted)] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">',
      '<div className="generator-progress-date-band bg-[var(--surface-muted)] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">',
      'progress date band',
    ],
    [
      '<div className="grid gap-2.5 bg-[var(--accent-soft)] px-3 py-3">',
      '<div className="generator-progress-editing grid gap-2.5 bg-[var(--accent-soft)] px-3 py-3">',
      'progress editing state',
    ],
    [
      '<div className="group grid gap-2 px-3 py-2.5 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-start">',
      '<div className="generator-progress-entry group grid gap-2 px-3 py-2.5 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-start">',
      'progress timeline entry',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchCss() {
  const path = 'src/styles/app.css';
  let css = readFileSync(path, 'utf8');
  if (css.includes('.generator-operations-surface {')) return;
  const block = `

@layer components {
  .generator-operations-surface {
    position: relative;
    border-color: color-mix(in srgb, var(--accent-cyan) 16%, var(--border-subtle));
    background:
      radial-gradient(
        circle at 100% 0%,
        color-mix(in srgb, var(--accent-cyan) 5%, transparent),
        transparent 22rem
      ),
      var(--surface-panel);
    box-shadow: var(--shadow-sm), var(--shadow-inset);
  }

  .generator-operations-header {
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--accent-cyan) 7%, var(--surface-muted)),
        color-mix(in srgb, var(--surface-muted) 86%, transparent) 42%,
        transparent
      );
  }

  .generator-evidence-dropzone,
  .generator-ocr-dropzone {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-control);
    border-color: color-mix(in srgb, var(--accent-cyan) 25%, var(--border-default));
    background:
      linear-gradient(
        120deg,
        color-mix(in srgb, var(--accent-cyan) 5%, var(--surface-muted)),
        var(--surface-muted) 48%,
        color-mix(in srgb, var(--accent-soft) 14%, var(--surface-muted))
      );
  }

  .generator-evidence-dropzone::before,
  .generator-ocr-dropzone::before {
    position: absolute;
    inset-block: 0;
    left: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--accent-cyan), var(--accent-solid));
    content: '';
  }

  .generator-evidence-card {
    transition:
      border-color var(--motion-fast) var(--ease-out),
      box-shadow var(--motion-fast) var(--ease-out),
      transform var(--motion-fast) var(--ease-out);
  }

  .generator-evidence-card:hover {
    border-color: color-mix(in srgb, var(--accent-cyan) 22%, var(--border-subtle));
    box-shadow: var(--shadow-xs);
  }

  .generator-evidence-state-badge {
    box-shadow: inset 0 1px 0 color-mix(in srgb, white 18%, transparent);
  }

  .generator-evidence-scan,
  .generator-ocr-progress {
    background: color-mix(in srgb, var(--accent-soft) 18%, var(--surface-panel));
  }

  .generator-evidence-review,
  .generator-ocr-result {
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent-solid) 75%, transparent);
  }

  .generator-ocr-result--ambiguous {
    box-shadow: inset 3px 0 0 var(--warning-solid);
  }

  .generator-evidence-selected {
    background: color-mix(in srgb, var(--success-soft) 40%, var(--surface-panel));
  }

  .generator-ocr-candidate {
    background: color-mix(in srgb, var(--surface-panel) 92%, transparent);
  }

  .generator-ocr-candidate:hover {
    background: color-mix(in srgb, var(--accent-soft) 34%, var(--surface-panel));
  }

  .generator-ocr-details > summary {
    list-style-position: inside;
  }

  .generator-progress-snippet-deck {
    background:
      linear-gradient(
        120deg,
        color-mix(in srgb, var(--accent-soft) 18%, var(--surface-muted)),
        var(--surface-muted) 54%,
        color-mix(in srgb, var(--accent-cyan) 4%, var(--surface-muted))
      );
  }

  .generator-progress-compose-grid {
    position: relative;
  }

  .generator-progress-compose-grid::before {
    position: absolute;
    inset-block: 0;
    left: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--accent-solid), var(--accent-cyan));
    content: '';
  }

  .generator-progress-history > div {
    position: relative;
  }

  .generator-progress-date-band {
    position: sticky;
    top: 0;
    z-index: 2;
    border-bottom: 1px solid var(--border-subtle);
    backdrop-filter: blur(10px);
  }

  .generator-progress-entry {
    position: relative;
    transition: background-color var(--motion-fast) var(--ease-out);
  }

  .generator-progress-entry::before {
    position: absolute;
    top: 1.1rem;
    left: 1rem;
    width: 0.45rem;
    height: 0.45rem;
    border: 2px solid var(--surface-panel);
    border-radius: 999px;
    background: var(--accent-solid);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-solid) 35%, var(--border-subtle));
    content: '';
  }

  .generator-progress-entry:hover {
    background: color-mix(in srgb, var(--accent-soft) 15%, transparent);
  }

  .generator-progress-entry > time {
    padding-left: 1rem;
  }

  .generator-progress-editing {
    box-shadow: inset 3px 0 0 var(--accent-solid);
  }

  .generator-operations-empty {
    border-color: color-mix(in srgb, var(--accent-cyan) 20%, var(--border-default));
    background: color-mix(in srgb, var(--surface-panel) 96%, var(--accent-soft));
  }

  @media (max-width: 639px) {
    .generator-progress-entry::before {
      top: 0.95rem;
      left: 0.75rem;
    }

    .generator-progress-entry > time {
      padding-left: 0.9rem;
    }
  }
}
`;
  css += block;
  writeFileSync(path, css);
}

function recordEvidence() {
  const path = 'docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-TRACKER.md';
  let text = readFileSync(path, 'utf8');
  text = replaceRequired(
    text,
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 IN PROGRESS',
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 IN PROGRESS',
    'tracker status',
  );
  const unchecked = `## GUX-3 — Operations timeline + evidence

- [ ] Evidence Workspace redesign.
- [ ] OCR/Coordinate extraction redesign.
- [ ] Progress Composer redesign.
- [ ] Progress Timeline redesign.
- [ ] local-file/privacy semantics preserved.
- [ ] revision-safe Progress semantics preserved.`;
  const checked = `## GUX-3 — Operations timeline + evidence

- [x] Evidence Workspace redesign.
- [x] OCR/Coordinate extraction redesign.
- [x] Progress Composer redesign.
- [x] Progress Timeline redesign.
- [x] local-file/privacy semantics preserved.
- [x] revision-safe Progress semantics preserved.

### GUX-3 automated evidence

GUX-3 presentation changes passed targeted Evidence Workspace, local OCR/coordinate, Progress Composer/presets, evidence recovery and revision-safe Progress persistence regression coverage, committed Prettier formatting, ESLint, the full unit/component suite and the production build. The implementation adds operations-specific semantic classes and CSS hierarchy only. Local evidence binaries remain browser-only, OCR behavior and coordinate verification are unchanged, and Progress append/update/remove continue through the existing optimistic-revision persistence contracts.`;
  text = replaceRequired(text, unchecked, checked, 'GUX-3 checklist');
  writeFileSync(path, text);
}

if (mode === 'apply') {
  patchEvidenceWorkspace();
  patchCoordinateExtractor();
  patchProgressComposer();
  patchProgressTimeline();
  patchCss();
} else if (mode === 'record') {
  recordEvidence();
} else {
  throw new Error(`Unknown GUX-3 mode: ${mode}`);
}
