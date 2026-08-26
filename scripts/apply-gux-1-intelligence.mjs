import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const mode = process.argv[2] ?? 'apply';

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) {
    if (text.includes(to)) return text;
    throw new Error(`GUX-1 marker not found: ${label}`);
  }
  return text.replace(from, to);
}

function patchSmartImport() {
  const path = 'src/features/ticket-generator/components/SmartPasteParser.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      'className="generator-smart-import overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-accent)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-intelligence-surface generator-smart-import overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-accent)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'smart import surface',
    ],
    [
      '<header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      '<header className="generator-intelligence-header generator-smart-import__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      'smart import header',
    ],
    [
      '<div className="flex min-w-0 items-center gap-2">',
      '<div className="generator-intelligence-title flex min-w-0 items-center gap-2">',
      'smart import title group',
    ],
    [
      '<div className="flex items-center gap-1">',
      '<div className="generator-import-source-switch flex items-center gap-1">',
      'source switch',
    ],
    [
      '<div className="p-3">',
      '<div className="generator-smart-import__body p-3">',
      'smart import body',
    ],
    [
      '<div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-3">',
      '<div className="generator-import-dropzone rounded-[var(--radius-control)] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-3">',
      'msg dropzone',
    ],
    [
      '<div className="mt-3 border-t border-[var(--border-subtle)] pt-3">',
      '<div className="generator-import-review mt-3 border-t border-[var(--border-subtle)] pt-3">',
      'import review',
    ],
    [
      '<span className="shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--text-faint)]">',
      '<span className="generator-source-badge shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--text-faint)]">',
      'source badge',
    ],
    [
      '<div className="mt-2.5 rounded-[var(--radius-control)] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-2.5">',
      '<div className="generator-intelligence-alert generator-intelligence-alert--blocking mt-2.5 rounded-[var(--radius-control)] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-2.5">',
      'blocking conflict',
    ],
    [
      '<div className="mt-2.5 grid gap-1.5">\n              {plan.map((item) => {',
      '<div className="generator-import-plan mt-2.5 grid gap-1.5">\n              {plan.map((item) => {',
      'import plan',
    ],
    [
      'className={`flex min-h-10 items-start gap-2 rounded-[var(--radius-control)] border px-2.5 py-1.5 ${',
      'className={`generator-import-plan-row flex min-h-10 items-start gap-2 rounded-[var(--radius-control)] border px-2.5 py-1.5 ${',
      'import plan row',
    ],
    [
      '<div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5">',
      '<div className="generator-import-apply-bar mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5">',
      'apply bar',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchValidation() {
  const path = 'src/features/ticket-generator/components/ValidationCenter.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      '<div className="min-w-0 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2">',
      '<div className="generator-readiness-metric min-w-0 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2">',
      'readiness metric',
    ],
    [
      '<div className="grid gap-3">\n      <DuplicateRelatedPanel',
      '<div className="generator-readiness-stack grid gap-3">\n      <DuplicateRelatedPanel',
      'readiness stack',
    ],
    [
      'className="generator-validation-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-intelligence-surface generator-validation-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'validation surface',
    ],
    [
      '<header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      '<header className="generator-intelligence-header generator-validation-center__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      'validation header',
    ],
    [
      '<div className="grid gap-2 border-b border-[var(--border-subtle)] p-3 sm:grid-cols-2 xl:grid-cols-5">',
      '<div className="generator-readiness-metrics grid gap-2 border-b border-[var(--border-subtle)] p-3 sm:grid-cols-2 xl:grid-cols-5">',
      'readiness metrics',
    ],
    [
      '<div className="p-3">\n          {findings.length ? (',
      '<div className="generator-readiness-findings p-3">\n          {findings.length ? (',
      'readiness findings',
    ],
    [
      'className="flex min-h-9 w-full items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"\n                    onClick={() => onFocusField(item.field)}',
      'className="generator-finding generator-finding--interactive flex min-h-9 w-full items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"\n                    data-severity={item.severity}\n                    onClick={() => onFocusField(item.field)}',
      'interactive finding',
    ],
    [
      'className="flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5"\n                  >',
      'className="generator-finding flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5"\n                    data-severity={item.severity}\n                  >',
      'static finding',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchDuplicates() {
  const path = 'src/features/ticket-generator/components/DuplicateRelatedPanel.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      '<article className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-2.5">',
      '<article className="generator-duplicate-card rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-2.5">',
      'duplicate card',
    ],
    [
      '<span className="rounded-full border border-[var(--warning-border)] bg-[var(--warning-soft)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--warning-text)]">\n          {evidence.level ?? \'review\'} · {evidence.score ?? 0}\n        </span>',
      '<span className="generator-risk-badge rounded-full border border-[var(--warning-border)] bg-[var(--warning-soft)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--warning-text)]">\n          {evidence.level ?? \'review\'} · {evidence.score ?? 0}\n        </span>',
      'risk badge',
    ],
    [
      '<section className="generator-duplicate-related overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      '<section className="generator-intelligence-surface generator-duplicate-related overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      'duplicate surface',
    ],
    [
      '<header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      '<header className="generator-intelligence-header generator-duplicate-related__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      'duplicate header',
    ],
    [
      '<div className="grid gap-3 p-3">',
      '<div className="generator-duplicate-related__body grid gap-3 p-3">',
      'duplicate body',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchCss() {
  const path = 'src/styles/app.css';
  let css = readFileSync(path, 'utf8');
  const marker = "[data-status='RUNNING'] {";
  if (!css.includes('.generator-intelligence-surface {')) {
    if (!css.includes(marker)) throw new Error('GUX-1 app.css insertion marker not found.');
    const block = `@layer components {
  .generator-intelligence-surface {
    position: relative;
    border-color: color-mix(in srgb, var(--accent-solid) 14%, var(--border-subtle));
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--surface-panel) 98%, var(--accent-soft)) 0%,
        var(--surface-panel) 52%,
        color-mix(in srgb, var(--surface-panel) 97%, var(--accent-cyan)) 100%
      );
    box-shadow: var(--shadow-sm), var(--shadow-inset);
  }

  .generator-intelligence-surface::after {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      115deg,
      color-mix(in srgb, var(--accent-solid) 4%, transparent),
      transparent 36%,
      color-mix(in srgb, var(--accent-cyan) 3%, transparent)
    );
    content: '';
    pointer-events: none;
  }

  .generator-intelligence-surface > * {
    position: relative;
    z-index: 1;
  }

  .generator-intelligence-header {
    background: color-mix(in srgb, var(--surface-muted) 68%, transparent);
    backdrop-filter: blur(14px);
  }

  .generator-intelligence-title > svg {
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--accent-solid) 35%, transparent));
  }

  .generator-import-source-switch {
    padding: 0.15rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-control);
    background: color-mix(in srgb, var(--surface-muted) 88%, transparent);
  }

  .generator-import-dropzone {
    position: relative;
    overflow: hidden;
    border-color: color-mix(in srgb, var(--accent-solid) 30%, var(--border-default));
    background:
      radial-gradient(
        circle at 100% 0%,
        color-mix(in srgb, var(--accent-cyan) 8%, transparent),
        transparent 18rem
      ),
      color-mix(in srgb, var(--surface-muted) 90%, transparent);
  }

  .generator-import-dropzone::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--accent-solid), var(--accent-cyan));
    content: '';
  }

  .generator-import-review {
    position: relative;
  }

  .generator-source-badge,
  .generator-risk-badge {
    box-shadow: inset 0 1px 0 color-mix(in srgb, white 24%, transparent);
  }

  .generator-intelligence-alert {
    position: relative;
    overflow: hidden;
  }

  .generator-intelligence-alert::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    content: '';
  }

  .generator-intelligence-alert--blocking::before {
    background: var(--danger-solid);
  }

  .generator-import-plan {
    container-type: inline-size;
  }

  .generator-import-plan-row {
    transition:
      transform var(--motion-fast) var(--ease-out),
      border-color var(--motion-fast) var(--ease-out),
      background-color var(--motion-fast) var(--ease-out);
  }

  .generator-import-plan-row:has(input:checked) {
    border-color: color-mix(in srgb, var(--accent-solid) 34%, var(--border-subtle));
    background: color-mix(in srgb, var(--accent-soft) 32%, var(--surface-muted));
  }

  .generator-import-plan-row:has(input:focus-visible) {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .generator-import-apply-bar {
    position: sticky;
    bottom: 0;
    z-index: 3;
    margin-inline: -0.25rem;
    padding: 0.65rem 0.25rem 0.1rem;
    background: linear-gradient(180deg, transparent, var(--surface-panel) 28%);
  }

  .generator-readiness-stack {
    position: relative;
  }

  .generator-readiness-metrics {
    background: color-mix(in srgb, var(--surface-muted) 48%, transparent);
  }

  .generator-readiness-metric {
    position: relative;
    overflow: hidden;
    border-color: color-mix(in srgb, var(--accent-solid) 10%, var(--border-subtle));
    background: color-mix(in srgb, var(--surface-panel) 72%, var(--surface-muted));
  }

  .generator-readiness-metric::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent-solid) 28%, transparent), transparent);
    content: '';
  }

  .generator-readiness-findings {
    background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--surface-muted) 32%, transparent));
  }

  .generator-finding {
    position: relative;
    overflow: hidden;
  }

  .generator-finding::before {
    width: 3px;
    align-self: stretch;
    flex: 0 0 auto;
    border-radius: var(--radius-pill);
    background: var(--border-default);
    content: '';
  }

  .generator-finding[data-severity='blocking']::before {
    background: var(--danger-solid);
  }

  .generator-finding[data-severity='warning']::before {
    background: var(--warning-solid);
  }

  .generator-finding[data-severity='info']::before {
    background: var(--accent-cyan);
  }

  .generator-finding--interactive:hover {
    border-color: color-mix(in srgb, var(--accent-solid) 24%, var(--border-subtle));
  }

  .generator-duplicate-card {
    position: relative;
    overflow: hidden;
    transition:
      transform var(--motion-fast) var(--ease-out),
      border-color var(--motion-fast) var(--ease-out),
      box-shadow var(--motion-fast) var(--ease-out);
  }

  .generator-duplicate-card:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--warning-solid) 30%, var(--border-subtle));
    box-shadow: var(--shadow-sm);
  }

  .generator-risk-badge {
    border-color: color-mix(in srgb, var(--warning-solid) 42%, var(--warning-border));
  }

  @container (min-width: 34rem) {
    .generator-import-plan {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

`;
    css = css.replace(marker, `${block}${marker}`);
  }
  writeFileSync(path, css);
}

function recordEvidence() {
  const path = 'docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-TRACKER.md';
  let text = readFileSync(path, 'utf8');
  const items = [
    'Unified Import visual redesign.',
    '`.msg` source/drop/input state redesign.',
    'source/confidence/conflict hierarchy.',
    'Validation Center severity hierarchy.',
    'duplicate/related risk visual integration.',
    'explicit operator decision actions remain obvious.',
    'behavioral regression coverage green.',
  ];
  for (const item of items) text = text.replace(`- [ ] ${item}`, `- [x] ${item}`);
  text = text.replace(
    '**Status:** GUX-0 COMPLETE · GUX-1 IN PROGRESS',
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 IN PROGRESS',
  );
  if (!text.includes('### GUX-1 automated evidence')) {
    text = text.replace(
      '## GUX-2 — Core incident authoring',
      '### GUX-1 automated evidence\n\nGUX-1 presentation changes passed targeted Unified Import, Validation Center and duplicate/related regression coverage, committed Prettier formatting, ESLint, the full unit/component suite and the production build. The patch adds only semantic presentation hooks, severity/risk data attributes and CSS hierarchy. Parser behavior, selective Apply, duplicate scoring, bounded Firestore reads, related-Ticket actions, lifecycle gating and persistence contracts remain unchanged.\n\n## GUX-2 — Core incident authoring',
    );
  }
  writeFileSync(path, text);
}

if (mode === 'apply') {
  patchSmartImport();
  patchValidation();
  patchDuplicates();
  patchCss();
} else if (mode === 'record') {
  recordEvidence();
} else {
  throw new Error(`Unknown GUX-1 mode: ${mode}`);
}
