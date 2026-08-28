import { expect, test } from '@playwright/test';

const PROJECT_ID = 'demo-nocreport';
const AUTH_ORIGIN = 'http://127.0.0.1:9099';
const FIRESTORE_ORIGIN = 'http://127.0.0.1:8080';
const PASSWORD = 'NocReport-Codex-Visual-QA-2026!';
const account = {
  email: 'codex-visual-qa@nocreport.test',
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

async function createAccount() {
  const response = await globalThis.fetch(
    `${AUTH_ORIGIN}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: account.email, password: PASSWORD, returnSecureToken: true }),
    },
  );
  if (response.ok) {
    account.uid = (await response.json()).localId;
    return;
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
    'Resolve visual QA account',
  );
  account.uid = (await signIn.json()).localId;
}

async function seedProfile() {
  await requireOk(
    await globalThis.fetch(
      `${FIRESTORE_ORIGIN}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${account.uid}`,
      {
        method: 'PATCH',
        headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            schemaVersion: { integerValue: '1' },
            active: { booleanValue: true },
            role: { stringValue: 'ADMIN' },
            email: { stringValue: account.email },
            displayName: { stringValue: 'Codex Visual QA' },
          },
        }),
      },
    ),
    'Seed visual QA profile',
  );
}

async function seedTickets() {
  for (let index = 0; index < 7; index += 1) {
    const number = String(index + 1).padStart(2, '0');
    const running = index === 0;
    const occurAt = new Date(Date.UTC(2026, 7, 29 - index, 1, index));
    const updatedAt = new Date(Date.UTC(2026, 7, 29 - index, 2, index));
    const fields = {
      schemaVersion: { integerValue: '1' },
      title: {
        stringValue: `[VISUAL-QA-${number}] PT. IFORTE SOLUSI INFOTEK | LCO_ISI_JKT_SBY_001 | [OPEN - MAJOR] DWDM Karawang - Purwakarta backbone down with an intentionally long operational incident title`,
      },
      externalTtNumber: { stringValue: `INC-20260829-009900${number}` },
      status: { stringValue: running ? 'RUNNING' : 'RESOLVED' },
      revision: { integerValue: String(index + 1) },
      occurAt: { timestampValue: occurAt.toISOString() },
      dispatchAt: { timestampValue: occurAt.toISOString() },
      pic: { stringValue: `Regional operator ${number} (Karawang timur)` },
      rootcause: { stringValue: 'Backbone cable degradation under investigation' },
      cutPoint: {
        stringValue: `OTDR FO CUT at KM ${24 + index} from Majalengka toward remote node ${number}`,
      },
      hasCoordinates: { booleanValue: true },
      coordinate: {
        mapValue: {
          fields: {
            latitude: { doubleValue: -6.24 - index * 0.08 },
            longitude: { doubleValue: 106.83 + index * 0.13 },
            source: { stringValue: 'manual' },
            verified: { booleanValue: true },
            verifiedAt: { timestampValue: updatedAt.toISOString() },
            verifiedBy: { stringValue: account.uid },
          },
        },
      },
      latestProgress: {
        mapValue: {
          fields: {
            progressId: { stringValue: `visual-progress-${number}` },
            occurredAt: { timestampValue: updatedAt.toISOString() },
            text: {
              stringValue:
                'Team OTW ke lokasi cut point, koordinasi lintas area berjalan dan material recovery sedang dipersiapkan.',
            },
          },
        },
      },
      createdAt: { timestampValue: occurAt.toISOString() },
      updatedAt: { timestampValue: updatedAt.toISOString() },
    };
    if (!running) {
      fields.closedAt = { timestampValue: updatedAt.toISOString() };
      fields.resolvedAt = { timestampValue: updatedAt.toISOString() };
    }
    await requireOk(
      await globalThis.fetch(
        `${FIRESTORE_ORIGIN}/v1/projects/${PROJECT_ID}/databases/(default)/documents/tickets/visual-${number}`,
        {
          method: 'PATCH',
          headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        },
      ),
      `Seed visual QA Ticket ${number}`,
    );
  }
}

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function assertNoOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 1);
}

test.beforeAll(async () => {
  await clearFirestore();
  await createAccount();
  await seedProfile();
  await seedTickets();
});

test('captures compact mobile and desktop operational workspaces', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await login(page);

  await expect(page.locator('.dashboard-ticket-row')).toHaveCount(7);
  await assertNoOverflow(page);
  const dashboardRows = await page
    .locator('.dashboard-ticket-row')
    .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
  expect(Math.max(...dashboardRows)).toBeLessThanOrEqual(92);
  await page.screenshot({ path: 'test-results/ui-qa/dashboard-mobile.png' });

  await page.goto('/running');
  const runningCard = page.locator('.running-ticket-card');
  await expect(runningCard).toHaveCount(1);
  await assertNoOverflow(page);
  const titleMetrics = await runningCard
    .locator('.running-ticket-card__title')
    .evaluate((title) => {
      const style = window.getComputedStyle(title);
      return { height: title.getBoundingClientRect().height, clamp: style.webkitLineClamp };
    });
  expect(titleMetrics.clamp).toBe('2');
  expect(titleMetrics.height).toBeLessThanOrEqual(44);
  await page.screenshot({ path: 'test-results/ui-qa/running-mobile.png' });

  await page.goto('/cut-points');
  await expect(page.getByRole('button', { name: 'Refresh data' })).toBeEnabled();
  await expect(page.getByRole('radio', { name: 'Show map', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Show mapped incidents' })).toContainText('7');
  await expect(page.locator('.cut-point-map-pane')).toBeVisible();
  await expect(page.locator('.cut-point-incident-pane')).toBeHidden();
  await assertNoOverflow(page);
  await page.screenshot({ path: 'test-results/ui-qa/map-mobile.png' });

  await page.getByRole('radio', { name: 'Show mapped incidents', exact: true }).click();
  await expect(page.locator('.cut-point-map-pane')).toBeHidden();
  await expect(page.locator('.cut-point-incident-pane')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.shell-page-header__title')).toBeVisible();
  await page.screenshot({ path: 'test-results/ui-qa/incidents-mobile.png' });
  await page.getByRole('button', { name: 'Locate' }).first().click();
  await expect(page.locator('.cut-point-map-pane')).toBeVisible();

  await page.setViewportSize({ width: 1720, height: 920 });
  await page.goto('/settings');
  const settingsWidth = await page
    .locator('.settings-page')
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(settingsWidth).toBeLessThanOrEqual(1121);
  await assertNoOverflow(page);
  await page.screenshot({ path: 'test-results/ui-qa/settings-desktop.png' });

  await page.goto('/cut-points');
  await expect(page.getByRole('button', { name: 'Refresh data' })).toBeEnabled();
  await expect(page.getByText('7 visible · query cap 500')).toBeVisible();
  await expect(page.getByRole('separator')).toBeVisible();
  await expect(page.locator('.cut-point-map-pane')).toBeVisible();
  await page.screenshot({ path: 'test-results/ui-qa/map-desktop.png' });
});
