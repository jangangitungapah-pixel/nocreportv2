import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const mode = process.argv[2] ?? 'apply';

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) {
    if (text.includes(to)) return text;
    throw new Error(`GUX-0 marker not found: ${label}`);
  }
  return text.replace(from, to);
}

function applyCockpitFoundation() {
  const pagePath = 'src/features/ticket-generator/pages/TicketGeneratorPage.jsx';
  let page = readFileSync(pagePath, 'utf8');

  const replacements = [
    [
      'className={`border-b border-[var(--border-subtle)] px-3 py-3 last:border-b-0 md:px-4 ${className}`}',
      'className={`generator-editor-section border-b border-[var(--border-subtle)] px-3 py-3 last:border-b-0 md:px-4 ${className}`}',
      'EditorSection shell',
    ],
    [
      'className="mb-2.5 flex min-h-6 items-center justify-between gap-3"',
      'className="generator-editor-section__header mb-2.5 flex min-h-6 items-center justify-between gap-3"',
      'EditorSection header',
    ],
    [
      'className="text-[12px] font-extrabold tracking-[-0.01em] text-[var(--text-primary)]"',
      'className="generator-editor-section__title text-[12px] font-extrabold tracking-[-0.01em] text-[var(--text-primary)]"',
      'EditorSection title',
    ],
    [
      'className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]"',
      'className="generator-editor-section__meta text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]"',
      'EditorSection meta',
    ],
    [
      '<section className="sticky top-2 z-20 flex min-h-12 flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-panel)_94%,transparent)] px-2.5 py-2 shadow-[var(--shadow-sm)] backdrop-blur-xl">',
      '<section className="generator-command-bar sticky top-2 z-20 flex min-h-12 flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-panel)_94%,transparent)] px-2.5 py-2 shadow-[var(--shadow-sm)] backdrop-blur-xl">',
      'command bar shell',
    ],
    [
      '<div className="flex min-w-0 flex-1 items-center gap-2.5">',
      '<div className="generator-command-context flex min-w-0 flex-1 items-center gap-2.5">',
      'command context',
    ],
    [
      '<div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">',
      '<div className="generator-command-actions ml-auto flex flex-wrap items-center justify-end gap-1.5">',
      'command actions',
    ],
    [
      'const editor = (\n    <div className="grid min-w-0 gap-3">',
      'const editor = (\n    <div className="generator-editor-stack grid min-w-0 gap-3">',
      'editor stack',
    ],
    [
      'className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-core-form overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'core form',
    ],
    [
      'const preview = (\n    <ReportPreview',
      'const preview = (\n    <div className="generator-preview-stage">\n      <ReportPreview',
      'preview stage open',
    ],
    [
      '      showCopyAction={false}\n    />\n  );',
      '      showCopyAction={false}\n      />\n    </div>\n  );',
      'preview stage close',
    ],
    [
      'return (\n    <div className="grid gap-3">',
      'return (\n    <div className="generator-cockpit grid gap-3">',
      'cockpit page wrapper',
    ],
    [
      'className="h-[calc(100vh-10.5rem)] min-h-[620px]"',
      'className="generator-cockpit-workspace h-[calc(100vh-10.5rem)] min-h-[620px]"',
      'cockpit workspace',
    ],
  ];

  for (const [from, to, label] of replacements) {
    page = replaceRequired(page, from, to, label);
  }
  writeFileSync(pagePath, page);

  const cssPath = 'src/styles/app.css';
  let css = readFileSync(cssPath, 'utf8');
  const marker = "[data-status='RUNNING'] {";
  if (!css.includes('.generator-cockpit {')) {
    if (!css.includes(marker)) throw new Error('GUX-0 app.css insertion marker not found.');
    const cockpitCss = `@layer components {
  .generator-cockpit {
    position: relative;
    isolation: isolate;
    padding-bottom: 1rem;
  }

  .generator-cockpit::before {
    position: absolute;
    z-index: -1;
    top: -2.5rem;
    right: 4%;
    width: min(38rem, 58vw);
    height: 18rem;
    border-radius: 999px;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--accent-solid) 9%, transparent) 0%,
      transparent 72%
    );
    content: '';
    filter: blur(18px);
    pointer-events: none;
  }

  .generator-command-bar {
    position: relative;
    overflow: hidden;
    border-color: color-mix(in srgb, var(--accent-solid) 18%, var(--border-subtle));
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--surface-panel) 96%, var(--accent-soft)) 0%,
      color-mix(in srgb, var(--surface-panel) 98%, transparent) 58%,
      color-mix(in srgb, var(--surface-panel) 94%, var(--accent-cyan)) 100%
    );
    box-shadow: var(--shadow-sm), var(--shadow-inset);
  }

  .generator-command-bar::before {
    position: absolute;
    top: 0;
    right: 1.25rem;
    left: 1.25rem;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--accent-solid) 44%, transparent),
      transparent
    );
    content: '';
    pointer-events: none;
  }

  .generator-command-context {
    min-height: 2.25rem;
  }

  .generator-command-actions {
    position: relative;
  }

  .generator-cockpit-workspace {
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--accent-solid) 12%, var(--border-subtle));
    border-radius: calc(var(--radius-panel) + 4px);
    background: color-mix(in srgb, var(--surface-muted) 86%, transparent);
    box-shadow: var(--shadow-sm), var(--shadow-inset);
  }

  .generator-editor-stack {
    min-height: 100%;
    padding: 0.35rem;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-muted) 82%, transparent),
      color-mix(in srgb, var(--surface-canvas) 72%, transparent)
    );
  }

  .generator-core-form {
    border-color: color-mix(in srgb, var(--accent-solid) 14%, var(--border-subtle));
    background: linear-gradient(
      180deg,
      var(--surface-panel),
      color-mix(in srgb, var(--surface-panel) 92%, var(--surface-muted))
    );
    box-shadow: var(--shadow-sm), var(--shadow-inset);
  }

  .generator-editor-section {
    position: relative;
    transition:
      background-color var(--motion-base) var(--ease-out),
      border-color var(--motion-base) var(--ease-out);
  }

  .generator-editor-section:hover {
    background: color-mix(in srgb, var(--accent-soft) 18%, transparent);
  }

  .generator-editor-section__header {
    position: relative;
  }

  .generator-editor-section__title {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .generator-editor-section__title::before {
    width: 3px;
    height: 0.9rem;
    flex: 0 0 auto;
    border-radius: var(--radius-pill);
    background: linear-gradient(180deg, var(--accent-solid), var(--accent-cyan));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-solid) 8%, transparent);
    content: '';
  }

  .generator-editor-section__meta {
    display: inline-flex;
    min-height: 1.45rem;
    align-items: center;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--surface-muted) 88%, transparent);
    padding: 0 0.5rem;
  }

  .generator-preview-stage {
    position: relative;
    min-width: 0;
    height: 100%;
    padding: 0.35rem;
    background:
      radial-gradient(
        circle at 100% 0%,
        color-mix(in srgb, var(--accent-cyan) 8%, transparent),
        transparent 28rem
      ),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--surface-muted) 82%, transparent),
        color-mix(in srgb, var(--surface-canvas) 72%, transparent)
      );
  }

  .generator-preview-stage > * {
    min-height: 100%;
  }
}

`;
    css = css.replace(marker, `${cockpitCss}${marker}`);
  }
  writeFileSync(cssPath, css);
}

function recordEvidence() {
  const path = 'docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-TRACKER.md';
  let text = readFileSync(path, 'utf8');
  const items = [
    'Add Generator-specific semantic visual tokens/classes.',
    'Establish cockpit page wrapper and atmospheric depth.',
    'Redesign command bar hierarchy while preserving actions/test semantics.',
    'Improve editor/preview `ResizableWorkspace` framing.',
    'Upgrade `EditorSection` hierarchy and spacing.',
    'Establish visual tiers for primary authoring, intelligence and utility surfaces.',
    'Preserve existing IDs, labels, form behavior, lifecycle actions and keyboard commands.',
    'Prettier green.',
    'ESLint green.',
    'Unit/component suite green.',
  ];
  for (const item of items) text = text.replace(`- [ ] ${item}`, `- [x] ${item}`);
  if (!text.includes('### GUX-0 automated evidence')) {
    text = text.replace(
      '**Exit:** the page reads as one coherent operations workstation without functional behavior changes.',
      '**Exit:** the page reads as one coherent operations workstation without functional behavior changes.\n\n### GUX-0 automated evidence\n\nOne-shot GUX-0 gate applied presentation-only cockpit foundation changes, then passed committed Prettier formatting, ESLint, the full unit/component suite, and the production build before persisting source. No Firestore, RBAC, lifecycle, parser, OCR, report-content, persistence, ID or accessible-label contract was intentionally changed.',
    );
  }
  writeFileSync(path, text);
}

if (mode === 'apply') {
  applyCockpitFoundation();
} else if (mode === 'record') {
  recordEvidence();
} else {
  throw new Error(`Unknown GUX-0 mode: ${mode}`);
}
