import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const mode = process.argv[2] ?? 'apply';

function replaceRequired(text, from, to, label) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw new Error(`GUX-5 marker not found: ${label}`);
  return text.replace(from, to);
}

function patchGeneratorPage() {
  const path = 'src/features/ticket-generator/pages/TicketGeneratorPage.jsx';
  let text = readFileSync(path, 'utf8');
  text = replaceRequired(
    text,
    '        className="generator-cockpit-workspace h-[calc(100vh-10.5rem)] min-h-[620px]"\n      />',
    '        className="generator-cockpit-workspace h-[calc(100vh-10.5rem)] min-h-[620px]"\n        mobileClassName="generator-cockpit-mobile-flow"\n      />',
    'mobile workspace hook',
  );
  writeFileSync(path, text);
}

function patchCss() {
  const path = 'src/styles/app.css';
  let css = readFileSync(path, 'utf8');
  if (css.includes('.generator-cockpit-mobile-flow {')) return;

  css += `

@layer components {
  .generator-cockpit-mobile-flow {
    min-width: 0;
    max-width: 100%;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'editor'
      'preview';
  }

  .generator-cockpit-mobile-flow > .generator-editor-stack {
    grid-area: editor;
    min-width: 0;
    max-width: 100%;
  }

  .generator-cockpit-mobile-flow > .generator-preview-stage {
    grid-area: preview;
    min-width: 0;
    max-width: 100%;
    min-height: 28rem;
    border: 1px solid color-mix(in srgb, var(--accent-violet) 12%, var(--border-subtle));
    border-radius: var(--radius-panel);
  }

  @media (max-width: 767px) {
    .generator-cockpit {
      min-width: 0;
      max-width: 100%;
      gap: 0.65rem;
      padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
    }

    .generator-cockpit::before {
      right: -28%;
      width: 82vw;
      height: 12rem;
      opacity: 0.72;
    }

    .generator-command-bar {
      top: max(0.4rem, env(safe-area-inset-top));
      z-index: 30;
      width: 100%;
      max-width: 100%;
      min-height: auto;
      align-items: stretch;
      gap: 0.4rem;
      padding: 0.5rem;
      overflow: hidden;
      border-radius: calc(var(--radius-panel) - 2px);
    }

    .generator-command-context {
      width: 100%;
      min-width: 0;
      min-height: 2rem;
      flex-basis: 100%;
      padding-inline: 0.15rem;
    }

    .generator-command-actions {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      margin-left: 0;
      flex-wrap: nowrap;
      justify-content: flex-start;
      gap: 0.4rem;
      overflow-x: auto;
      overflow-y: hidden;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      scroll-snap-type: x proximity;
      -webkit-overflow-scrolling: touch;
    }

    .generator-command-actions::-webkit-scrollbar {
      display: none;
    }

    .generator-command-actions > * {
      min-height: 44px;
      flex: 0 0 auto;
      scroll-snap-align: start;
    }

    .generator-cockpit :is(button, summary) {
      min-height: 44px;
    }

    .generator-cockpit label:has(input[type='checkbox']),
    .generator-cockpit label:has(input[type='radio']) {
      min-height: 44px;
    }

    .generator-cockpit :is(input:not([type='checkbox']):not([type='radio']):not([type='file']), select) {
      min-height: 44px;
    }

    .generator-cockpit textarea {
      min-height: 88px;
    }

    .generator-editor-stack,
    .generator-preview-stage,
    .generator-authoring-form,
    .generator-authoring-surface,
    .generator-intelligence-surface,
    .generator-operations-surface,
    .generator-output-surface,
    .generator-copy-center,
    .generator-report-preview,
    .generator-report-preview__surface,
    .generator-report-preview__stage,
    .generator-report-preview__document {
      min-width: 0;
      max-width: 100%;
    }

    .generator-editor-stack {
      gap: 0.65rem;
      padding: 0;
      background: transparent;
    }

    .generator-editor-section {
      padding-inline: 0.75rem;
      padding-block: 0.75rem;
    }

    .generator-editor-section__header,
    .generator-intelligence-header,
    .generator-operations-header,
    .generator-output-header,
    .generator-impact-header,
    .generator-handover-card__header,
    .generator-operator-presets__footer {
      min-width: 0;
      flex-wrap: wrap;
    }

    .generator-editor-section__meta {
      max-width: 100%;
      white-space: normal;
      text-align: right;
    }

    .generator-title-controlbar,
    .generator-tt-detection-bar,
    .generator-evidence-selected {
      min-width: 0;
      flex-wrap: wrap;
    }

    .generator-tt-detection-value {
      max-width: 100%;
      overflow-wrap: anywhere;
    }

    .generator-import-source-switch,
    .generator-copy-center__command,
    .generator-preset-utilities {
      min-width: 0;
      max-width: 100%;
    }

    .generator-impact-row {
      min-width: 0;
      padding-right: 0.7rem;
    }

    .generator-impact-row-actions,
    .generator-progress-entry > div:last-child,
    .generator-handover-card__header > div:last-child {
      min-width: 0;
      flex-wrap: wrap;
    }

    .generator-progress-entry,
    .generator-audit-change {
      min-width: 0;
    }

    .generator-copy-preview pre,
    .generator-handover-card__content,
    .generator-report-preview__content,
    .generator-audit-change span {
      min-width: 0;
      max-width: 100%;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .generator-report-preview__stage {
      padding: 0.35rem;
    }

    .generator-report-preview__document {
      min-height: 26rem;
    }

    .generator-report-preview__content {
      padding: 0.75rem;
      font-size: 11px;
      line-height: 1.6;
    }
  }
}
`;

  writeFileSync(path, css);
}

function writeMobileSpec() {
  const path = 'e2e/gux-5-mobile.spec.js';
  const content = `import { expect, test } from '@playwright/test';

const PROJECT_ID = 'demo-nocreport';
const AUTH_ORIGIN = 'http://127.0.0.1:9099';
const FIRESTORE_ORIGIN = 'http://127.0.0.1:8080';
const PASSWORD = 'NocReport-GUX5-E2E-2026!';
const account = {
  email: 'gux5-mobile@nocreport.test',
  role: 'ADMIN',
  active: true,
  uid: null,
};
const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];

async function requireOk(response, label) {
  if (response.ok) return response;
  throw new Error(\`${'${label}'} failed: ${'${response.status}'} ${'${await response.text()}'}\`);
}

async function clearFirestore() {
  await requireOk(
    await globalThis.fetch(
      \`${'${FIRESTORE_ORIGIN}'}/emulator/v1/projects/${'${PROJECT_ID}'}/databases/(default)/documents\`,
      { method: 'DELETE' },
    ),
    'Clear Firestore emulator',
  );
}

async function createAuthAccount() {
  const response = await globalThis.fetch(
    \`${'${AUTH_ORIGIN}'}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: account.email, password: PASSWORD, returnSecureToken: true }),
    },
  );
  if (response.ok) {
    const payload = await response.json();
    account.uid = payload.localId;
    return;
  }

  const payload = await response.json();
  if (payload?.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(\`Create Auth account failed: ${'${response.status}'} ${'${JSON.stringify(payload)}'}\`);
  }

  const signIn = await requireOk(
    await globalThis.fetch(
      \`${'${AUTH_ORIGIN}'}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key\`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: PASSWORD, returnSecureToken: true }),
      },
    ),
    'Resolve existing Auth account',
  );
  const signInPayload = await signIn.json();
  account.uid = signInPayload.localId;
}

async function seedProfile() {
  const url = \`${'${FIRESTORE_ORIGIN}'}/v1/projects/${'${PROJECT_ID}'}/databases/(default)/documents/users/${'${encodeURIComponent(account.uid)}'}\`;
  await requireOk(
    await globalThis.fetch(url, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          schemaVersion: { integerValue: '1' },
          active: { booleanValue: account.active },
          role: { stringValue: account.role },
          email: { stringValue: account.email },
          displayName: { stringValue: 'GUX-5 Mobile Admin' },
        },
      }),
    }),
    'Seed GUX-5 Admin profile',
  );
}

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\\/dashboard$/);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.documentWidth, \`${'${label}'} document width\`).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyWidth, \`${'${label}'} body width\`).toBeLessThanOrEqual(metrics.viewport + 1);
}

async function assertTouchTargets(locator, label) {
  const boxes = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { text: element.textContent?.trim() ?? '', width: rect.width, height: rect.height };
    }),
  );
  expect(boxes.length, \`${'${label}'} target count\`).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.height, \`${'${label}'} ${'${box.text}'} height\`).toBeGreaterThanOrEqual(43.5);
  }
}

test.beforeAll(async () => {
  await clearFirestore();
  await createAuthAccount();
  await seedProfile();
});

for (const viewport of viewports) {
  test(\`Generator mobile workspace is safe at ${'${viewport.width}'}x${'${viewport.height}'}\`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await clearFirestore();
    await seedProfile();
    await login(page);
    await page.goto('/generator/new');
    await expect(page.getByRole('heading', { name: 'New Ticket' })).toBeVisible();

    const longTitle =
      '[MANDAU-MOBILE-QA] LINK DOWN AT DWDM 100901_MOBILE_ALPHA <> 100902_MOBILE_BETA <> 100903_MOBILE_GAMMA [TT : INC-20260827-95550001]';
    await page.locator('#ticket-title').fill(longTitle);

    const mobileFlow = page.locator('.generator-cockpit-mobile-flow');
    await expect(mobileFlow).toBeVisible();
    const ordering = await page.evaluate(() => {
      const editor = document.querySelector('.generator-cockpit-mobile-flow > .generator-editor-stack');
      const preview = document.querySelector('.generator-cockpit-mobile-flow > .generator-preview-stage');
      const editorRect = editor?.getBoundingClientRect();
      const previewRect = preview?.getBoundingClientRect();
      return {
        editorTop: editorRect?.top ?? Number.NaN,
        previewTop: previewRect?.top ?? Number.NaN,
      };
    });
    expect(ordering.previewTop).toBeGreaterThan(ordering.editorTop);

    const commandBar = page.locator('.generator-command-bar');
    await expect(commandBar).toBeVisible();
    await assertTouchTargets(
      commandBar.locator('.generator-command-actions > button, .generator-command-actions > a'),
      \`${'${viewport.width}'}px command action\`,
    );
    await expect(commandBar.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(commandBar.getByRole('button', { name: 'Mark Running' })).toBeVisible();

    await assertNoHorizontalOverflow(page, \`${'${viewport.width}'}px initial Generator\`);

    await page.locator('.generator-progress-composer').scrollIntoViewIfNeeded();
    const sticky = await commandBar.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { position: getComputedStyle(element).position, top: rect.top, bottom: rect.bottom };
    });
    expect(sticky.position).toBe('sticky');
    expect(sticky.top).toBeGreaterThanOrEqual(0);
    expect(sticky.top).toBeLessThan(32);
    expect(sticky.bottom).toBeLessThanOrEqual(viewport.height);
    await expect(commandBar.getByRole('button', { name: 'Save' })).toBeVisible();
    await assertNoHorizontalOverflow(page, \`${'${viewport.width}'}px scrolled Generator\`);

    const report = page.getByLabel('Generated NOC report');
    await report.scrollIntoViewIfNeeded();
    await expect(report).toContainText('100901_MOBILE_ALPHA <> 100902_MOBILE_BETA <> 100903_MOBILE_GAMMA');
    await expect(report).toContainText('INC-20260827-95550001');
    await assertNoHorizontalOverflow(page, \`${'${viewport.width}'}px live output\`);

    const primaryField = page.locator('#ticket-title');
    const fieldBox = await primaryField.boundingBox();
    expect(fieldBox?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  });
}
`;
  writeFileSync(path, content);
}

function recordTracker() {
  const path = 'docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-TRACKER.md';
  let text = readFileSync(path, 'utf8');
  text = replaceRequired(
    text,
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 IN PROGRESS',
    '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 COMPLETE · GUX-6 IN PROGRESS',
    'tracker phase status',
  );
  text = replaceRequired(
    text,
    `## GUX-5 — Responsive/mobile workspace

- [ ] intentional mobile information ordering.
- [ ] sticky primary actions remain reachable.
- [ ] 360x800 green.
- [ ] 390x844 green.
- [ ] 412x915 green.
- [ ] no horizontal overflow.
- [ ] touch targets safe.`,
    `## GUX-5 — Responsive/mobile workspace

- [x] intentional mobile information ordering.
- [x] sticky primary actions remain reachable.
- [x] 360x800 green.
- [x] 390x844 green.
- [x] 412x915 green.
- [x] no horizontal overflow.
- [x] touch targets safe.

### GUX-5 automated evidence

GUX-5 passed the dedicated authenticated Chromium matrix at 360x800, 390x844 and 412x915 after presentation-only mobile workspace changes. The browser gate verifies explicit editor-before-live-output ordering, a sticky mobile command surface with reachable Save/transition actions, 44px-class primary action and field targets, and no document/body horizontal overflow before and after deep scrolling and at the live report output. Targeted Generator regression, the full unit/component suite and the production build also remain green. Desktop ResizableWorkspace behavior, form semantics, lifecycle actions, persistence, canonical report content and accessibility labels are unchanged.`,
    'GUX-5 checklist',
  );
  writeFileSync(path, text);
}

if (mode === 'apply') {
  patchGeneratorPage();
  patchCss();
  writeMobileSpec();
} else if (mode === 'record') {
  recordTracker();
} else {
  throw new Error(`Unknown GUX-5 helper mode: ${mode}`);
}
