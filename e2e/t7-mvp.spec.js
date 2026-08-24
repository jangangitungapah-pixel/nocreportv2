import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PROJECT_ID = 'demo-nocreport';
const APP_ORIGIN = 'http://127.0.0.1:5187';
const AUTH_ORIGIN = 'http://127.0.0.1:9099';
const FIRESTORE_ORIGIN = 'http://127.0.0.1:8080';
const PASSWORD = 'NocReport-T7-E2E-2026!';
const INCIDENT_TITLE = '[T7-E2E] BANDUNG LINK DOWN [TT : INC-20260821-00070001]';
const INCIDENT_TT = 'INC-20260821-00070001';

const accounts = {
  admin: { email: 't7-admin@nocreport.test', role: 'ADMIN', active: true, uid: null },
  operator: { email: 't7-operator@nocreport.test', role: 'OPERATOR', active: true, uid: null },
  viewer: { email: 't7-viewer@nocreport.test', role: 'VIEWER', active: true, uid: null },
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

async function createAuthAccount(account) {
  const response = await requireOk(
    await globalThis.fetch(
      `${AUTH_ORIGIN}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
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
    `Create ${account.role} Auth account`,
  );
  const payload = await response.json();
  account.uid = payload.localId;
}

async function seedProfile(account) {
  const url = `${FIRESTORE_ORIGIN}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${encodeURIComponent(account.uid)}`;
  await requireOk(
    await globalThis.fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          schemaVersion: { integerValue: '1' },
          active: { booleanValue: account.active },
          role: { stringValue: account.role },
          email: { stringValue: account.email },
          displayName: { stringValue: `T7 ${account.role}` },
        },
      }),
    }),
    `Seed ${account.role} profile`,
  );
}

async function login(page, account) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Operational overview' })).toBeVisible();
}

async function assertNoSeriousAxeViolations(page, label) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact),
  );
  expect(violations, `${label} has serious/critical axe violations`).toEqual([]);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(
    metrics.documentWidth <= metrics.viewport + 1 && metrics.bodyWidth <= metrics.viewport + 1,
    `${label} overflowed horizontally: ${JSON.stringify(metrics)}`,
  ).toBe(true);
}

async function resetProfiles() {
  await clearFirestore();
  for (const account of Object.values(accounts)) await seedProfile(account);
}

test.beforeAll(async () => {
  await clearFirestore();
  for (const account of Object.values(accounts)) await createAuthAccount(account);
  await resetProfiles();
});

test.describe.serial('T7 MVP browser workflow', () => {
  let ticketId = null;

  test('Admin creates, persists, reopens, maps, copies, and resolves a Ticket', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: APP_ORIGIN,
    });
    await login(page, accounts.admin);

    await page.getByRole('link', { name: 'New Ticket' }).click();
    await expect(page).toHaveURL(/\/generator\/new$/);

    await page.getByLabel('Title').fill(INCIDENT_TITLE);
    await page.getByLabel('Occur Time').fill('2026-08-21T08:00');
    await page.getByLabel('Dispatch Time').fill('2026-08-21T08:10');
    await page.getByLabel('PIC').fill('T7 Operator');
    await page.getByLabel('Rootcause').fill('Fiber cut during maintenance');
    await page.locator('#cut-point').fill('KM 12 from Bandung hub');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/generator\/[A-Za-z0-9_-]+$/);
    ticketId = new URL(page.url()).pathname.split('/').at(-1);
    expect(ticketId).toBeTruthy();

    await page.getByRole('button', { name: 'Mark Running' }).click();

    await page.getByLabel('Event time').fill('2026-08-21T08:30');
    await page.getByLabel('Progress update').fill('Team arrived at the Cut Point');
    await page.getByRole('button', { name: 'Add update' }).click();
    await expect(page.getByText('Team arrived at the Cut Point', { exact: true })).toBeVisible();

    await page.getByLabel('Latitude').fill('-6.917464');
    await page.getByLabel('Longitude').fill('107.619123');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/Saved to Firestore · revision/)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Title')).toHaveValue(INCIDENT_TITLE);
    await expect(page.getByText('Team arrived at the Cut Point', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Latitude')).toHaveValue('-6.917464');
    await expect(page.getByLabel('Longitude')).toHaveValue('107.619123');

    await page.getByRole('button', { name: 'Copy Report' }).click();
    await expect(page.getByText('Report copied')).toBeVisible();

    await page.goto('/running');
    const runningTable = page.getByRole('table');
    await expect(runningTable.getByText(INCIDENT_TITLE, { exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: /Search Running Tickets/ }).fill('00070001');
    await expect(runningTable.getByText(INCIDENT_TITLE, { exact: true })).toBeVisible();

    await page.goto('/cut-points');
    await expect(page.getByText(INCIDENT_TITLE, { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Locate' }).first().click();
    await expect(page.locator('.leaflet-popup')).toContainText(INCIDENT_TT);

    await page.goto('/running');
    const incidentRow = page.getByRole('row').filter({ hasText: INCIDENT_TT });
    await expect(incidentRow).toBeVisible();
    await incidentRow.getByRole('button', { name: `Resolve ${INCIDENT_TT}` }).click();
    await expect(page.getByText('Ticket resolved')).toBeVisible();
    await expect(page.getByText(INCIDENT_TITLE, { exact: true })).toHaveCount(0);
  });

  test('Operator and Viewer UI restrictions match the role matrix', async ({ browser }) => {
    const operatorContext = await browser.newContext();
    const operatorPage = await operatorContext.newPage();
    await login(operatorPage, accounts.operator);
    await expect(operatorPage.getByRole('link', { name: 'New Ticket' })).toBeVisible();
    await operatorContext.close();

    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    await login(viewerPage, accounts.viewer);
    await expect(viewerPage.getByRole('link', { name: 'New Ticket' })).toHaveCount(0);
    await viewerPage.goto('/generator/new');
    await expect(viewerPage).toHaveURL(/\/dashboard$/);

    if (ticketId) {
      await viewerPage.goto(`/generator/${ticketId}`);
      await expect(viewerPage.getByText('Viewer read-only mode')).toBeVisible();
      await expect(viewerPage.getByRole('button', { name: 'Copy Report' })).toBeVisible();
      await expect(viewerPage.getByRole('button', { name: 'Save' })).toHaveCount(0);
    }
    await viewerContext.close();
  });

  test('primary routes pass responsive overflow and serious axe checks', async ({ page }) => {
    await login(page, accounts.admin);
    const routes = ['/dashboard', '/generator/new', '/running', '/cut-points'];
    const viewports = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 412, height: 915 },
      { width: 768, height: 900 },
      { width: 1024, height: 900 },
      { width: 1280, height: 900 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const route of routes) {
        await page.goto(route);
        await expect(page.locator('body')).toBeVisible();
        await assertNoHorizontalOverflow(page, `${route} at ${viewport.width}px`);
      }
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await assertNoSeriousAxeViolations(page, route);
    }
  });
});
