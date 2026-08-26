import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const mode = process.argv[2] ?? 'apply';

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) {
    if (text.includes(to)) return text;
    throw new Error(`GUX-2 marker not found: ${label}`);
  }
  return text.replace(from, to);
}

function patchPage() {
  const path = 'src/features/ticket-generator/pages/TicketGeneratorPage.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      'className="generator-core-form overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-authoring-form generator-core-form overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'authoring form',
    ],
    [
      '<EditorSection title="Ticket Identity" meta="Required for Running">',
      '<EditorSection\n          title="Ticket Identity"\n          meta="Required for Running"\n          className="generator-authoring-section generator-authoring-section--identity"\n        >',
      'identity section',
    ],
    [
      '<div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2 text-[10px]">',
      '<div className="generator-title-controlbar mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2 text-[10px]">',
      'smart title control bar',
    ],
    [
      '<div className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-2 text-[10px]">',
      '<div className="generator-tt-detection-bar mt-2 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-2 text-[10px]">',
      'detected TT bar',
    ],
    [
      '<strong className="truncate font-mono text-[var(--text-secondary)]">',
      '<strong className="generator-tt-detection-value truncate font-mono text-[var(--text-secondary)]">',
      'detected TT value',
    ],
    [
      '<EditorSection title="Incident Timing" meta="Operational clock">',
      '<EditorSection\n          title="Incident Timing"\n          meta="Operational clock"\n          className="generator-authoring-section generator-authoring-section--timing"\n        >',
      'timing section',
    ],
    [
      '<div className="grid gap-3 md:grid-cols-2">\n            <DateTimeField',
      '<div className="generator-timing-grid grid gap-3 md:grid-cols-2">\n            <DateTimeField',
      'timing grid',
    ],
    [
      '<EditorSection title="Assignment & Diagnosis">',
      '<EditorSection\n          title="Assignment & Diagnosis"\n          className="generator-authoring-section generator-authoring-section--diagnosis"\n        >',
      'diagnosis section',
    ],
    [
      '<div className="grid gap-3 md:grid-cols-2">\n            <TextInput\n              id="pic"',
      '<div className="generator-assignment-grid grid gap-3 md:grid-cols-2">\n            <TextInput\n              id="pic"',
      'assignment grid',
    ],
    [
      '<div className="mt-3">\n            <Textarea\n              id="cut-point"',
      '<div className="generator-cutpoint-field mt-3">\n            <Textarea\n              id="cut-point"',
      'cut point field',
    ],
    [
      '<EditorSection title="Cut Point Coordinate" meta="Operator verified">',
      '<EditorSection\n          title="Cut Point Coordinate"\n          meta="Operator verified"\n          className="generator-authoring-section generator-authoring-section--coordinate"\n        >',
      'coordinate section',
    ],
    [
      '<div className="grid gap-3 md:grid-cols-2">\n            <TextInput\n              id="latitude"',
      '<div className="generator-coordinate-grid grid gap-3 md:grid-cols-2">\n            <TextInput\n              id="latitude"',
      'coordinate grid',
    ],
    [
      '<div\n            className={`mt-2.5 border-l-2 px-2.5 py-1.5 text-[11px] leading-5 ${',
      '<div\n            className={`generator-coordinate-summary mt-2.5 border-l-2 px-2.5 py-1.5 text-[11px] leading-5 ${',
      'coordinate summary class',
    ],
    [
      '          >\n            <span className="font-semibold">Normalized:</span> {coordinate.text}',
      '            data-state={coordinate.valid ? \'valid\' : \'invalid\'}\n          >\n            <span className="font-semibold">Normalized:</span> {coordinate.text}',
      'coordinate summary state',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchImpactEditor() {
  const path = 'src/features/ticket-generator/components/ImpactListEditor.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      '<section className="generator-impact-editor overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      '<section className="generator-authoring-surface generator-impact-editor overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      'impact surface',
    ],
    [
      '<header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">',
      '<header className="generator-impact-header flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">',
      'impact header',
    ],
    [
      '<p className="px-3 py-3 text-xs font-medium text-[var(--text-muted)]">',
      '<p className="generator-impact-empty px-3 py-3 text-xs font-medium text-[var(--text-muted)]">',
      'impact empty state',
    ],
    [
      '<div className="divide-y divide-[var(--border-subtle)]">',
      '<div className="generator-impact-list divide-y divide-[var(--border-subtle)]">',
      'impact list',
    ],
    [
      'className="grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"\n            >',
      'className="generator-impact-row grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"\n              data-index={index + 1}\n            >',
      'impact row',
    ],
    [
      '<div className="flex items-center justify-end gap-1">',
      '<div className="generator-impact-row-actions flex items-center justify-end gap-1">',
      'impact row actions',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchImpactBuilder() {
  const path = 'src/features/ticket-generator/components/ImpactBuilder.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      '<div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">',
      '<div className="generator-impact-builder border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">',
      'impact builder',
    ],
    [
      '<div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">',
      '<div className="generator-impact-builder-grid grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">',
      'impact builder grid',
    ],
    [
      '<div className="min-h-[6.5rem] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-2.5">',
      '<div className="generator-impact-preview min-h-[6.5rem] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-2.5">',
      'impact preview',
    ],
    [
      '<div className="mt-2 grid max-h-36 gap-1.5 overflow-y-auto">',
      '<div className="generator-impact-candidates mt-2 grid max-h-36 gap-1.5 overflow-y-auto">',
      'impact candidate list',
    ],
    [
      'className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-[10.5px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"',
      'className="generator-impact-candidate flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-[10.5px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"',
      'impact candidate',
    ],
    [
      '<div className="mt-2 flex justify-end">',
      '<div className="generator-impact-builder-actions mt-2 flex justify-end">',
      'impact builder actions',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchCss() {
  const path = 'src/styles/app.css';
  let css = readFileSync(path, 'utf8');
  const marker = "[data-status='RUNNING'] {";
  if (css.includes('.generator-authoring-form {')) return;
  if (!css.includes(marker)) throw new Error('GUX-2 app.css insertion marker not found.');

  const block = `@layer components {
  .generator-authoring-form,
  .generator-authoring-surface {
    position: relative;
    border-color: color-mix(in srgb, var(--accent-solid) 12%, var(--border-subtle));
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--surface-panel) 99%, var(--accent-soft)), var(--surface-panel));
    box-shadow: var(--shadow-sm), var(--shadow-inset);
  }

  .generator-authoring-form::before,
  .generator-authoring-surface::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent-solid) 42%, transparent), transparent);
    content: '';
    pointer-events: none;
  }

  .generator-authoring-section {
    position: relative;
    isolation: isolate;
    transition: background-color var(--motion-fast) var(--ease-out);
  }

  .generator-authoring-section::before {
    position: absolute;
    top: 1rem;
    bottom: 1rem;
    left: 0;
    width: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent-solid) 38%, var(--border-default));
    content: '';
    opacity: 0.72;
  }

  .generator-authoring-section--identity {
    background: radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--accent-solid) 7%, transparent), transparent 18rem);
  }

  .generator-authoring-section--identity::before {
    background: linear-gradient(180deg, var(--accent-solid), color-mix(in srgb, var(--accent-cyan) 75%, var(--accent-solid)));
  }

  .generator-authoring-section--timing::before {
    background: color-mix(in srgb, var(--warning-solid) 72%, var(--accent-solid));
  }

  .generator-authoring-section--diagnosis::before {
    background: color-mix(in srgb, var(--accent-cyan) 68%, var(--accent-solid));
  }

  .generator-authoring-section--coordinate::before {
    background: color-mix(in srgb, var(--success-solid) 72%, var(--accent-solid));
  }

  .generator-authoring-section .generator-editor-section__header {
    margin-bottom: 0.8rem;
  }

  .generator-authoring-section .generator-editor-section__meta {
    padding: 0.22rem 0.48rem;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface-muted) 82%, transparent);
  }

  .generator-title-controlbar,
  .generator-tt-detection-bar {
    margin-inline: -0.15rem;
    padding: 0.55rem 0.65rem 0;
  }

  .generator-title-controlbar {
    border-radius: var(--radius-control);
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent-soft) 28%, transparent), transparent 76%);
  }

  .generator-tt-detection-bar {
    align-items: center;
  }

  .generator-tt-detection-value {
    max-width: min(100%, 26rem);
    padding: 0.25rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--accent-solid) 24%, var(--border-subtle));
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent-soft) 24%, var(--surface-muted));
    color: var(--text-primary);
    letter-spacing: 0.02em;
  }

  .generator-timing-grid > *,
  .generator-assignment-grid > *,
  .generator-coordinate-grid > * {
    border-radius: var(--radius-control);
    background: color-mix(in srgb, var(--surface-muted) 35%, transparent);
  }

  .generator-cutpoint-field {
    padding-top: 0.15rem;
  }

  .generator-coordinate-summary {
    border-radius: 0 var(--radius-control) var(--radius-control) 0;
    background: color-mix(in srgb, var(--surface-muted) 58%, transparent);
  }

  .generator-coordinate-summary[data-state='valid'] {
    border-color: var(--success-solid);
    background: color-mix(in srgb, var(--success-soft) 38%, var(--surface-muted));
  }

  .generator-impact-header {
    min-height: 3rem;
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent-soft) 24%, var(--surface-panel)), var(--surface-panel));
  }

  .generator-impact-builder {
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--accent-cyan) 7%, transparent), transparent 18rem),
      color-mix(in srgb, var(--surface-muted) 80%, transparent);
  }

  .generator-impact-preview {
    box-shadow: var(--shadow-xs), inset 0 1px 0 color-mix(in srgb, white 18%, transparent);
  }

  .generator-impact-candidate {
    border: 1px solid transparent;
    transition: border-color var(--motion-fast) var(--ease-out), background-color var(--motion-fast) var(--ease-out);
  }

  .generator-impact-candidate:has(input:checked) {
    border-color: color-mix(in srgb, var(--accent-solid) 24%, var(--border-subtle));
    background: color-mix(in srgb, var(--accent-soft) 24%, var(--surface-muted));
    color: var(--text-primary);
  }

  .generator-impact-row {
    position: relative;
    padding-left: 3rem;
    transition: background-color var(--motion-fast) var(--ease-out);
  }

  .generator-impact-row::before {
    position: absolute;
    top: 0.95rem;
    left: 0.85rem;
    display: grid;
    width: 1.55rem;
    height: 1.55rem;
    place-items: center;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    background: var(--surface-muted);
    color: var(--text-faint);
    content: attr(data-index);
    font-family: var(--font-mono);
    font-size: 0.58rem;
    font-weight: 800;
  }

  .generator-impact-row:focus-within {
    background: color-mix(in srgb, var(--accent-soft) 18%, transparent);
  }

  .generator-impact-row-actions {
    padding-bottom: 0.1rem;
  }

  .generator-impact-empty {
    background: linear-gradient(90deg, color-mix(in srgb, var(--surface-muted) 76%, transparent), transparent);
  }

  @media (max-width: 640px) {
    .generator-authoring-section::before {
      top: 0.8rem;
      bottom: 0.8rem;
    }

    .generator-title-controlbar,
    .generator-tt-detection-bar {
      margin-inline: 0;
      padding-inline: 0;
    }

    .generator-impact-row {
      padding-left: 2.75rem;
    }
  }
}

`;
  css = css.replace(marker, block + marker);
  writeFileSync(path, css);
}

function recordTracker() {
  const path = 'docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-TRACKER.md';
  let text = readFileSync(path, 'utf8');
  text = replaceRequired(
    text,
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 IN PROGRESS',
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 IN PROGRESS',
    'tracker status',
  );
  const before = `## GUX-2 — Core incident authoring

- [ ] Ticket Identity redesign.
- [ ] timing redesign.
- [ ] assignment/diagnosis redesign.
- [ ] coordinate section redesign.
- [ ] Impact editor/builder redesign.
- [ ] Smart Title + detected TT scanability.
- [ ] validation/focus semantics preserved.
`;
  const after = `## GUX-2 — Core incident authoring

- [x] Ticket Identity redesign.
- [x] timing redesign.
- [x] assignment/diagnosis redesign.
- [x] coordinate section redesign.
- [x] Impact editor/builder redesign.
- [x] Smart Title + detected TT scanability.
- [x] validation/focus semantics preserved.

### GUX-2 automated evidence

GUX-2 presentation changes passed targeted Generator core-authoring, Smart Title and Impact Builder regression coverage, committed Prettier formatting, ESLint, the full unit/component suite and the production build. The implementation adds authoring-specific semantic classes, visual state attributes and CSS hierarchy only. Existing field IDs, React Hook Form registrations, validation focus mapping, Smart Title handlers, coordinate verification semantics, Impact mutation behavior, lifecycle rules, persistence and Firestore contracts remain unchanged.
`;
  text = replaceRequired(text, before, after, 'GUX-2 checklist');
  writeFileSync(path, text);
}

if (mode === 'apply') {
  patchPage();
  patchImpactEditor();
  patchImpactBuilder();
  patchCss();
} else if (mode === 'record') {
  recordTracker();
} else {
  throw new Error(`Unknown GUX-2 mode: ${mode}`);
}
