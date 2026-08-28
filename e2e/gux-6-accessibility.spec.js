import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PROJECT_ID = 'demo-nocreport';
const AUTH_ORIGIN = 'http://127.0.0.1:9099';
const FIRESTORE_ORIGIN = 'http://127.0.0.1:8080';
const PASSWORD = 'NocReport-GUX6-E2E-2026!';
const account = {
  email: 'gux6-accessibility@nocreport.test',
  role: 'ADMIN',
  active: true,
  uid: null,
};

async function requireOk(response, label) {
  if (response.ok) return response;
  throw new Error(`${label} failed: ${response.status} ${await response.text()}`);
}

async function clearFirestore() {
  await requireOk(
    await globalThis.fetch(
      `${FIRESTORE_ORIGIN}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      { method: 'DELETE' },
    ),
    'Clear Firestore emulator',
  );
}

async function createAuthAccount() {
  const response = await globalThis.fetch(
    `${AUTH_ORIGIN}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
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
    throw new Error(`Create Auth account failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  const signIn = await requireOk(
    await globalThis.fetch(
      `${AUTH_ORIGIN}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: PASSWORD,
          returnSecureToken: true,
        }),
      },
    ),
    'Resolve existing Auth account',
  );
  account.uid = (await signIn.json()).localId;
}

async function seedProfile() {
  const url = `${FIRESTORE_ORIGIN}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${encodeURIComponent(account.uid)}`;
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
          displayName: { stringValue: 'GUX-6 Accessibility Admin' },
        },
      }),
    }),
    'Seed GUX-6 Admin profile',
  );
}

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openGenerator(page) {
  await clearFirestore();
  await seedProfile();
  await login(page);
  await page.goto('/generator/new');
  await expect(page.getByRole('heading', { name: 'New Ticket' })).toBeVisible();
  await expect(page.locator('.generator-cockpit')).toBeVisible();
}

async function expandValidationCenter(page) {
  const toggle = page.locator(
    'button[aria-controls="generator-validation-center-content"]',
  );
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAccessibleName('Expand Validation Center');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveAccessibleName('Collapse Validation Center');
  await expect(page.locator('#generator-validation-center-content')).toBeVisible();
}

async function assertNoSeriousOrCriticalAxeViolations(page, label) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact),
  );
  expect(violations, `${label} has serious/critical axe violations`).toEqual([]);
}

async function readThemeEvidence(page) {
  return page.evaluate(() => {
    const root = window.getComputedStyle(document.documentElement);
    const cockpit = document.querySelector('.generator-cockpit');
    const commandBar = document.querySelector('.generator-command-bar');
    const blocking = document.querySelector(".generator-finding[data-severity='blocking']");
    return {
      canvas: root.getPropertyValue('--surface-canvas').trim(),
      panel: root.getPropertyValue('--surface-panel').trim(),
      text: root.getPropertyValue('--text-primary').trim(),
      successBorder: root.getPropertyValue('--success-border').trim(),
      dangerBorder: root.getPropertyValue('--danger-border').trim(),
      warningBorder: root.getPropertyValue('--warning-border').trim(),
      infoBorder: root.getPropertyValue('--accent-cyan').trim(),
      cockpitColor: cockpit ? window.getComputedStyle(cockpit).color : '',
      commandBackground: commandBar ? window.getComputedStyle(commandBar).backgroundImage : '',
      blockingBorder: blocking ? window.getComputedStyle(blocking).borderTopColor : '',
      defaultBorder: root.getPropertyValue('--border-subtle').trim(),
    };
  });
}

async function tabTo(page, locator, limit = 120) {
  for (let index = 0; index < limit; index += 1) {
    if (await locator.evaluate((element) => document.activeElement === element)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Keyboard could not reach ${await locator.getAttribute('id')}`);
}

test.beforeAll(async () => {
  await clearFirestore();
  await createAuthAccount();
  await seedProfile();
});

test('Generator Light and Dark themes expose distinct, complete accessible states', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await openGenerator(page);
  await expandValidationCenter(page);

  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(page.locator(".generator-finding[data-severity='blocking']").first()).toBeVisible();

  const light = await readThemeEvidence(page);
  expect(light.successBorder).not.toBe('');
  expect(new Set([light.dangerBorder, light.warningBorder, light.infoBorder]).size).toBe(3);
  expect(light.blockingBorder).not.toBe(light.defaultBorder);
  expect(light.commandBackground).not.toBe('none');
  await assertNoSeriousOrCriticalAxeViolations(page, 'Generator light theme');
  await testInfo.attach('generator-light.png', {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  const dark = await readThemeEvidence(page);
  expect(dark.successBorder).not.toBe('');
  expect(new Set([dark.dangerBorder, dark.warningBorder, dark.infoBorder]).size).toBe(3);
  expect(dark.blockingBorder).not.toBe(dark.defaultBorder);
  expect(dark.canvas).not.toBe(light.canvas);
  expect(dark.panel).not.toBe(light.panel);
  expect(dark.text).not.toBe(light.text);
  expect(dark.cockpitColor).not.toBe(light.cockpitColor);
  await assertNoSeriousOrCriticalAxeViolations(page, 'Generator dark theme');
  await testInfo.attach('generator-dark.png', {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
});

test('Generator focus order is keyboard reachable and visibly focused', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await openGenerator(page);

  const order = await page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll(
        "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => !element.disabled && element.getAttribute('aria-hidden') !== 'true');
    const indexes = [
      'ticket-title',
      'occur-at',
      'dispatch-at',
      'pic',
      'rootcause',
      'cut-point',
    ].map((id) => controls.indexOf(document.getElementById(id)));
    const positiveTabIndexes = Array.from(document.querySelectorAll('[tabindex]'))
      .map((element) => Number(element.getAttribute('tabindex')))
      .filter((value) => value > 0);
    return { indexes, positiveTabIndexes };
  });
  expect(order.positiveTabIndexes).toEqual([]);
  expect(order.indexes.every((value) => value >= 0)).toBe(true);
  expect(order.indexes).toEqual([...order.indexes].sort((left, right) => left - right));

  await page.locator('body').focus();
  const title = page.locator('#ticket-title');
  await tabTo(page, title);
  await expect(title).toBeFocused();
  const focusStyle = await title.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(2);

  await expandValidationCenter(page);
  const finding = page.locator('.generator-finding--interactive').first();
  await expect(finding).toBeVisible();
  await finding.focus();
  await page.keyboard.press('Enter');
  const focusedField = await page.evaluate(() => document.activeElement?.id ?? '');
  expect([
    'ticket-title',
    'occur-at',
    'dispatch-at',
    'pic',
    'rootcause',
    'cut-point',
    'latitude',
    'longitude',
    'progress-text',
  ]).toContain(focusedField);

  const save = page.getByRole('button', { name: 'Save' });
  await tabTo(page, save, 180);
  await expect(save).toBeFocused();
});

test('Generator honors reduced motion for CSS and focus scrolling', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await openGenerator(page);
  await expandValidationCenter(page);

  await expect
    .poll(() => page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches))
    .toBe(true);

  const motion = await page.locator('.generator-command-bar').evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      animationDuration: style.animationDuration,
      scrollBehavior: style.scrollBehavior,
      transitionDuration: style.transitionDuration,
    };
  });
  expect(motion.animationDuration).toBe('0s');
  expect(motion.transitionDuration).toBe('0s');
  expect(motion.scrollBehavior).toBe('auto');

  await page.evaluate(() => {
    const originalScrollIntoView = window.Element.prototype.scrollIntoView;
    window.__gux6ScrollBehaviors = [];
    window.Element.prototype.scrollIntoView = function scrollIntoView(options) {
      window.__gux6ScrollBehaviors.push(options?.behavior ?? null);
      if (typeof originalScrollIntoView === 'function') {
        return originalScrollIntoView.call(this, { ...options, behavior: 'auto' });
      }
      return undefined;
    };
  });

  const finding = page.locator('.generator-finding--interactive').first();
  await expect(finding).toBeVisible();
  await finding.focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => window.__gux6ScrollBehaviors.length))
    .toBeGreaterThan(0);
  const behaviors = await page.evaluate(() => window.__gux6ScrollBehaviors);
  expect(behaviors.every((behavior) => behavior === 'auto')).toBe(true);
});
