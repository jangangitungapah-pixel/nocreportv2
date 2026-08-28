import { expect, test } from '@playwright/test';

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
        body: JSON.stringify({ email: account.email, password: PASSWORD, returnSecureToken: true }),
      },
    ),
    'Resolve existing Auth account',
  );
  const signInPayload = await signIn.json();
  account.uid = signInPayload.localId;
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
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const offenders = Array.from(document.querySelectorAll('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        };
      })
      .filter((item) => item.right > viewport + 1 || item.left < -1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 12);

    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      offenders,
    };
  });

  expect(
    metrics.documentWidth,
    `${label} document width; offenders=${JSON.stringify(metrics.offenders)}`,
  ).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(
    metrics.bodyWidth,
    `${label} body width; offenders=${JSON.stringify(metrics.offenders)}`,
  ).toBeLessThanOrEqual(metrics.viewport + 1);
}
async function assertTouchTargets(locator, label) {
  const boxes = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { text: element.textContent?.trim() ?? '', width: rect.width, height: rect.height };
    }),
  );
  expect(boxes.length, `${label} target count`).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.height, `${label} ${box.text} height`).toBeGreaterThanOrEqual(43.5);
  }
}

test.beforeAll(async () => {
  await clearFirestore();
  await createAuthAccount();
  await seedProfile();
});

for (const viewport of viewports) {
  test(`Generator mobile workspace is safe at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
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
    await expect(mobileFlow.locator('.generator-flow-stage[data-expanded="true"]')).toHaveCount(1);
    await expect(
      mobileFlow
        .locator('.generator-flow-stage[data-expanded="false"] .generator-flow-stage__body')
        .first(),
    ).toBeHidden();
    await expect(mobileFlow.locator(':scope > .generator-preview-stage')).toBeHidden();

    const commandBar = page.locator('.generator-command-bar');
    await expect(commandBar).toBeVisible();
    await assertTouchTargets(
      commandBar.locator('.generator-command-actions > button, .generator-command-actions > a'),
      `${viewport.width}px command action`,
    );
    await expect(commandBar.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(commandBar.getByRole('button', { name: 'Mark Running' })).toBeVisible();

    await assertNoHorizontalOverflow(page, `${viewport.width}px initial Generator`);

    expect(await commandBar.evaluate((element) => window.getComputedStyle(element).position)).toBe(
      'static',
    );

    await page.getByRole('button', { name: /Response/ }).click();
    const responseStage = page.locator('#generator-stage-response');
    await expect(responseStage).toHaveAttribute('data-expanded', 'true');
    await page.locator('.generator-progress-composer').scrollIntoViewIfNeeded();
    await expect(page.locator('.generator-progress-composer')).toBeVisible();
    await assertNoHorizontalOverflow(page, `${viewport.width}px response stage`);

    await page.getByRole('button', { name: /Handover/ }).click();
    await expect(page.locator('#generator-stage-handover')).toHaveAttribute(
      'data-expanded',
      'true',
    );
    await assertNoHorizontalOverflow(page, `${viewport.width}px handover stage`);

    const report = page.getByLabel('Generated NOC report');
    await expect(report).toContainText(
      '100901_MOBILE_ALPHA <> 100902_MOBILE_BETA <> 100903_MOBILE_GAMMA',
    );
    await expect(report).toContainText('INC-20260827-95550001');
    await assertNoHorizontalOverflow(page, `${viewport.width}px live output`);

    await page.getByRole('button', { name: /Incident/ }).click();
    const primaryField = page.locator('#ticket-title');
    await expect(primaryField).toBeVisible();
    const fieldBox = await primaryField.boundingBox();
    expect(fieldBox?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  });
}
