import { readFileSync, writeFileSync } from 'node:fs';

const mode = process.argv[2] ?? 'apply';
const pagePath = 'src/features/ticket-generator/pages/TicketGeneratorPage.jsx';
const validationPath = 'src/features/ticket-generator/components/ValidationCenter.jsx';
const tokensPath = 'src/styles/tokens.css';
const stylesPath = 'src/styles/app.css';
const trackerPath = 'docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-TRACKER.md';

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Missing ${label} anchor`);
  return source.replace(before, after);
}

function apply() {
  let tokens = readFileSync(tokensPath, 'utf8');
  tokens = replaceOnce(
    tokens,
    '  --success-solid: #139767;\n  --success-soft: #e9f8f2;\n  --success-text: #0b7650;',
    '  --success-solid: #139767;\n  --success-soft: #e9f8f2;\n  --success-border: #9bd8c1;\n  --success-text: #0b7650;',
    'Light success border token',
  );
  tokens = replaceOnce(
    tokens,
    '  --success-solid: #37bd89;\n  --success-soft: #123128;\n  --success-text: #77ddb4;',
    '  --success-solid: #37bd89;\n  --success-soft: #123128;\n  --success-border: #2f6b57;\n  --success-text: #77ddb4;',
    'Dark success border token',
  );
  writeFileSync(tokensPath, tokens);

  let page = readFileSync(pagePath, 'utf8');
  page = replaceOnce(
    page,
    "function focusWorkspaceElement(id) {",
    "function preferredWorkspaceScrollBehavior() {\n  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {\n    return 'smooth';\n  }\n  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';\n}\n\nfunction focusWorkspaceElement(id) {",
    'Generator motion preference helper',
  );
  page = page.replaceAll("behavior: 'smooth'", 'behavior: preferredWorkspaceScrollBehavior()');
  writeFileSync(pagePath, page);

  let validation = readFileSync(validationPath, 'utf8');
  validation = replaceOnce(
    validation,
    'function focusDuplicateReview() {',
    "function preferredWorkspaceScrollBehavior() {\n  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {\n    return 'smooth';\n  }\n  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';\n}\n\nfunction focusDuplicateReview() {",
    'Validation motion preference helper',
  );
  validation = validation.replaceAll(
    "behavior: 'smooth'",
    'behavior: preferredWorkspaceScrollBehavior()',
  );
  writeFileSync(validationPath, validation);

  let styles = readFileSync(stylesPath, 'utf8');
  const marker = '/* GUX-6 theme, focus and reduced-motion parity. */';
  if (!styles.includes(marker)) {
    styles += `

${marker}
@layer components {
  .generator-cockpit :focus-visible {
    outline: 2px solid var(--focus-ring) !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--focus-soft);
  }

  .generator-command-bar:focus-within,
  .generator-validation-center:focus-visible {
    border-color: var(--border-accent);
    box-shadow: var(--shadow-sm), var(--shadow-inset), 0 0 0 3px var(--focus-soft);
  }

  .generator-finding[data-severity='blocking'] {
    border-color: color-mix(in srgb, var(--danger-solid) 42%, var(--border-default));
  }

  .generator-finding[data-severity='warning'] {
    border-color: color-mix(in srgb, var(--warning-solid) 42%, var(--border-default));
  }

  .generator-finding[data-severity='info'] {
    border-color: color-mix(in srgb, var(--accent-cyan) 36%, var(--border-default));
  }
}

@media (prefers-reduced-motion: reduce) {
  .generator-cockpit,
  .generator-cockpit *,
  .generator-cockpit::before,
  .generator-cockpit::after,
  .generator-cockpit *::before,
  .generator-cockpit *::after {
    scroll-behavior: auto !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
  }
}
`;
  }
  writeFileSync(stylesPath, styles);
}

function record() {
  let tracker = readFileSync(trackerPath, 'utf8');
  tracker = replaceOnce(
    tracker,
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 COMPLETE · GUX-6 IN PROGRESS',
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 COMPLETE · GUX-6 COMPLETE · GUX-7 IN PROGRESS',
    'GUX-6 tracker status',
  );
  const before = `## GUX-6 — Theme, motion and accessibility polish

- [ ] Light theme visual QA.
- [ ] Dark theme visual QA.
- [ ] contrast/state differentiation.
- [ ] keyboard/focus order.
- [ ] reduced-motion behavior.
- [ ] serious/critical axe clean.

## GUX-7 — Integrated release readiness`;
  const after = `## GUX-6 — Theme, motion and accessibility polish

- [x] Light theme visual QA.
- [x] Dark theme visual QA.
- [x] contrast/state differentiation.
- [x] keyboard/focus order.
- [x] reduced-motion behavior.
- [x] serious/critical axe clean.

### GUX-6 automated evidence

GUX-6 passed dedicated authenticated Chromium coverage in Light and Dark themes. The gate verifies distinct semantic state borders and complete success tokens, keyboard order without positive tabindex, visible Generator focus treatment, keyboard activation of validation findings, reduced-motion CSS and auto-scrolling focus paths, and zero serious/critical axe violations in both themes. Targeted Generator regression, the full unit/component suite and the production build also remain green. Firestore, RBAC, lifecycle, revision, import/OCR, validation and canonical report semantics are unchanged.

## GUX-7 — Integrated release readiness`;
  tracker = replaceOnce(tracker, before, after, 'GUX-6 checklist');
  writeFileSync(trackerPath, tracker);
}

if (mode === 'apply') apply();
else if (mode === 'record') record();
else throw new Error(`Unknown mode: ${mode}`);

