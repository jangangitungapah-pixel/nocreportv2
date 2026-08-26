import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const mode = process.argv[2] ?? 'apply';

function replaceRequired(text, from, to, label) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw new Error(`GUX-4 marker not found: ${label}`);
  return text.replace(from, to);
}

function patchReportPreview() {
  const path = 'src/features/ticket-generator/components/ReportPreview.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      '<section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      '<section className="generator-output-surface generator-report-preview__surface flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
      'report preview surface',
    ],
    [
      '<div className="flex min-h-10 shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-3">',
      '<div className="generator-output-header generator-report-preview__header flex min-h-10 shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] px-3">',
      'report preview header',
    ],
    [
      '<div className="min-h-0 flex-1 bg-[var(--surface-muted)] p-1.5">',
      '<div className="generator-report-preview__stage min-h-0 flex-1 bg-[var(--surface-muted)] p-1.5">',
      'report preview stage',
    ],
    [
      "'rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)]',",
      "'generator-report-preview__document rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)]',",
      'report preview document',
    ],
    [
      'className="min-h-full whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-5 text-[var(--text-primary)]"',
      'className="generator-report-preview__content min-h-full whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-5 text-[var(--text-primary)]"',
      'report preview content',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchCopyCenter() {
  const path = 'src/features/ticket-generator/components/CopyCenter.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      'className="generator-copy-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-output-surface generator-copy-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'copy center surface',
    ],
    [
      '<header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      '<header className="generator-output-header generator-copy-center__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      'copy center header',
    ],
    [
      '<div className="grid gap-3 p-3">',
      '<div className="generator-copy-center__body grid gap-3 p-3">',
      'copy center body',
    ],
    [
      '<div className="grid gap-2 sm:grid-cols-[minmax(220px,0.6fr)_auto] sm:items-end">',
      '<div className="generator-copy-center__command grid gap-2 sm:grid-cols-[minmax(220px,0.6fr)_auto] sm:items-end">',
      'copy center command',
    ],
    [
      '<div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]">',
      '<div className="generator-copy-preview overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]">',
      'copy preview',
    ],
    [
      '<div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)]">',
      '<div className="generator-handover-card overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)]">',
      'handover card',
    ],
    [
      '<div className="flex min-h-9 items-center justify-between gap-2 bg-[var(--surface-panel)] px-2.5">',
      '<div className="generator-handover-card__header flex min-h-9 items-center justify-between gap-2 bg-[var(--surface-panel)] px-2.5">',
      'handover header',
    ],
    [
      'className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2 font-mono text-[10px] leading-5 text-[var(--text-secondary)]"',
      'className="generator-handover-card__content max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2 font-mono text-[10px] leading-5 text-[var(--text-secondary)]"',
      'handover content',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchOperatorPresets() {
  const path = 'src/features/ticket-generator/components/OperatorPresetsPanel.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      '<label className="flex min-h-9 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">',
      '<label className="generator-preset-toggle flex min-h-9 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">',
      'preset toggle',
    ],
    [
      'className="generator-operator-presets overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-output-surface generator-operator-presets overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'operator presets surface',
    ],
    [
      '<header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      '<header className="generator-output-header generator-operator-presets__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">',
      'operator presets header',
    ],
    [
      '<div className="grid gap-3 p-3">',
      '<div className="generator-operator-presets__body grid gap-3 p-3">',
      'operator presets body',
    ],
    [
      '<div className="grid gap-2 md:grid-cols-2">',
      '<div className="generator-preset-utilities grid gap-2 md:grid-cols-2">',
      'preset utility grid',
    ],
    [
      '<div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5">',
      '<div className="generator-operator-presets__footer flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5">',
      'operator presets footer',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchAuditHistory() {
  const path = 'src/features/ticket-generator/components/TicketAuditHistory.jsx';
  let text = readFileSync(path, 'utf8');
  const replacements = [
    [
      'className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'className="generator-output-surface generator-audit-history overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"',
      'audit history surface',
    ],
    [
      '<header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">',
      '<header className="generator-output-header generator-audit-history__header flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">',
      'audit history header',
    ],
    [
      '<p className="px-3 py-4 text-[10px] text-[var(--text-muted)]">Loading revision history…</p>',
      '<p className="generator-audit-state px-3 py-4 text-[10px] text-[var(--text-muted)]">Loading revision history…</p>',
      'audit loading state',
    ],
    [
      '<p className="px-3 py-4 text-[10px] font-semibold text-[var(--danger-text)]" role="alert">',
      '<p className="generator-audit-state generator-audit-state--error px-3 py-4 text-[10px] font-semibold text-[var(--danger-text)]" role="alert">',
      'audit error state',
    ],
    [
      '<p className="px-3 py-4 text-[10px] text-[var(--text-muted)]">\n          No audit events recorded yet.\n        </p>',
      '<p className="generator-audit-state px-3 py-4 text-[10px] text-[var(--text-muted)]">\n          No audit events recorded yet.\n        </p>',
      'audit empty state',
    ],
    [
      '<article key={event.id} className="px-3 py-2.5">',
      '<article key={event.id} className="generator-audit-event px-3 py-2.5">',
      'audit event',
    ],
    [
      'className="grid gap-1 rounded-[var(--radius-control)] bg-[var(--surface-muted)] px-2 py-1.5 text-[9.5px] sm:grid-cols-[120px_minmax(0,1fr)]"',
      'className="generator-audit-change grid gap-1 rounded-[var(--radius-control)] bg-[var(--surface-muted)] px-2 py-1.5 text-[9.5px] sm:grid-cols-[120px_minmax(0,1fr)]"',
      'audit change',
    ],
  ];
  for (const [from, to, label] of replacements) text = replaceRequired(text, from, to, label);
  writeFileSync(path, text);
}

function patchCss() {
  const path = 'src/styles/app.css';
  let css = readFileSync(path, 'utf8');
  if (css.includes('.generator-output-surface {')) return;
  const block = `

@layer components {
  .generator-output-surface {
    position: relative;
    border-color: color-mix(in srgb, var(--accent-violet) 15%, var(--border-subtle));
    background:
      radial-gradient(
        circle at 100% 0%,
        color-mix(in srgb, var(--accent-violet) 5%, transparent),
        transparent 23rem
      ),
      var(--surface-panel);
    box-shadow: var(--shadow-sm), var(--shadow-inset);
  }

  .generator-output-header {
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--accent-violet) 7%, var(--surface-panel-strong)),
        color-mix(in srgb, var(--surface-panel-strong) 92%, transparent) 48%,
        transparent
      );
  }

  .generator-report-preview__stage {
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--accent-violet) 4%, var(--surface-muted)),
        var(--surface-muted) 55%,
        color-mix(in srgb, var(--accent-cyan) 3%, var(--surface-muted))
      );
  }

  .generator-report-preview__document {
    box-shadow:
      0 14px 30px color-mix(in srgb, var(--text-primary) 7%, transparent),
      inset 0 1px 0 color-mix(in srgb, white 12%, transparent);
  }

  .generator-report-preview__content {
    tab-size: 2;
  }

  .generator-copy-center__command {
    padding: 0.65rem;
    border: 1px solid color-mix(in srgb, var(--accent-violet) 17%, var(--border-subtle));
    border-radius: var(--radius-control);
    background: color-mix(in srgb, var(--accent-soft) 18%, var(--surface-muted));
  }

  .generator-copy-preview {
    border-color: color-mix(in srgb, var(--accent-violet) 15%, var(--border-subtle));
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent-violet) 65%, transparent);
  }

  .generator-handover-card {
    border-color: color-mix(in srgb, var(--accent-cyan) 18%, var(--border-subtle));
    background: color-mix(in srgb, var(--surface-panel) 96%, var(--accent-cyan));
  }

  .generator-handover-card__header {
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--accent-cyan) 7%, var(--surface-panel)),
        var(--surface-panel) 55%
      );
  }

  .generator-handover-card__content {
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent-cyan) 65%, transparent);
  }

  .generator-preset-toggle {
    transition:
      border-color var(--motion-fast) var(--ease-out),
      background-color var(--motion-fast) var(--ease-out);
  }

  .generator-preset-toggle:has(input:checked) {
    border-color: color-mix(in srgb, var(--accent-solid) 30%, var(--border-subtle));
    background: color-mix(in srgb, var(--accent-soft) 35%, var(--surface-muted));
  }

  .generator-preset-utilities {
    padding: 0.65rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-control);
    background: color-mix(in srgb, var(--surface-muted) 90%, transparent);
  }

  .generator-operator-presets__footer {
    border-color: color-mix(in srgb, var(--accent-violet) 12%, var(--border-subtle));
  }

  .generator-audit-history {
    overflow: clip;
  }

  .generator-audit-state {
    background: color-mix(in srgb, var(--surface-muted) 80%, transparent);
  }

  .generator-audit-state--error {
    box-shadow: inset 3px 0 0 var(--danger-solid);
  }

  .generator-audit-event {
    position: relative;
    padding-left: 1.25rem;
    transition: background-color var(--motion-fast) var(--ease-out);
  }

  .generator-audit-event::before {
    position: absolute;
    top: 1rem;
    left: 0.45rem;
    width: 0.4rem;
    height: 0.4rem;
    border: 2px solid color-mix(in srgb, var(--accent-violet) 55%, var(--border-default));
    border-radius: 999px;
    background: var(--surface-panel);
    content: '';
  }

  .generator-audit-event:hover {
    background: color-mix(in srgb, var(--accent-soft) 16%, transparent);
  }

  .generator-audit-change {
    border: 1px solid color-mix(in srgb, var(--accent-violet) 9%, var(--border-subtle));
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
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 IN PROGRESS',
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 IN PROGRESS',
    'tracker status',
  );
  const checks = [
    ['- [ ] Report Preview redesign.', '- [x] Report Preview redesign.'],
    ['- [ ] Copy Center redesign.', '- [x] Copy Center redesign.'],
    ['- [ ] Handover Summary utility redesign.', '- [x] Handover Summary utility redesign.'],
    ['- [ ] Operator Presets redesign.', '- [x] Operator Presets redesign.'],
    ['- [ ] Revision History/Audit redesign.', '- [x] Revision History/Audit redesign.'],
    ['- [ ] clipboard/audit semantics preserved.', '- [x] clipboard/audit semantics preserved.'],
  ];
  for (const [from, to] of checks) text = replaceRequired(text, from, to, from);
  const marker = '- [x] clipboard/audit semantics preserved.\n\n## GUX-5 — Responsive/mobile workspace';
  const evidence = `- [x] clipboard/audit semantics preserved.\n\n### GUX-4 automated evidence\n\nGUX-4 presentation changes passed targeted Copy Center, handover summary, Operator Presets, Revision History/Audit and Generator integration regression coverage, committed Prettier formatting, ESLint, the full unit/component suite and the production build. The implementation adds output/handover semantic classes and CSS hierarchy only. Canonical report generation, Copy Center target construction, clipboard callbacks, browser-local preset semantics, bounded immutable audit history reads and revision data contracts remain unchanged.\n\n## GUX-5 — Responsive/mobile workspace`;
  text = replaceRequired(text, marker, evidence, 'GUX-4 evidence');
  writeFileSync(path, text);
}

if (mode === 'apply') {
  patchReportPreview();
  patchCopyCenter();
  patchOperatorPresets();
  patchAuditHistory();
  patchCss();
} else if (mode === 'record') {
  recordEvidence();
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
