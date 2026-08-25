import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { Buffer } from 'node:buffer';

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

async function seedRunningDensityTickets(count = 5) {
  for (let index = 0; index < count; index += 1) {
    const suffix = String(index + 2).padStart(2, '0');
    const ticketId = `t7-density-${suffix}`;
    const ttNumber = `INC-20260821-000700${suffix}`;
    const occurAt = new Date(Date.UTC(2026, 7, 21, 8, index + 1));
    const updatedAt = new Date(Date.UTC(2026, 7, 21, 9, index + 1));
    const url = `${FIRESTORE_ORIGIN}/v1/projects/${PROJECT_ID}/databases/(default)/documents/tickets/${ticketId}`;

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
            title: { stringValue: `[T7-DENSITY-${suffix}] Running incident` },
            externalTtNumber: { stringValue: ttNumber },
            status: { stringValue: 'RUNNING' },
            revision: { integerValue: '1' },
            occurAt: { timestampValue: occurAt.toISOString() },
            dispatchAt: { timestampValue: occurAt.toISOString() },
            pic: { stringValue: `Density PIC ${suffix}` },
            rootcause: { stringValue: 'Density viewport fixture' },
            cutPoint: { stringValue: `Density Cut Point ${suffix}` },
            hasCoordinates: { booleanValue: false },
            latestProgress: {
              mapValue: {
                fields: {
                  progressId: { stringValue: `density-progress-${suffix}` },
                  occurredAt: { timestampValue: updatedAt.toISOString() },
                  text: { stringValue: `Density progress ${suffix} is being coordinated.` },
                },
              },
            },
            createdAt: { timestampValue: occurAt.toISOString() },
            updatedAt: { timestampValue: updatedAt.toISOString() },
          },
        }),
      }),
      `Seed Running density Ticket ${suffix}`,
    );
  }
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

async function assertSixRunningRowsAboveFold(page) {
  const rows = page.locator('[data-testid="data-table-desktop"] tbody tr');
  await expect(rows).toHaveCount(6);
  const sixthRow = rows.nth(5);
  await expect(sixthRow).toBeVisible();
  const box = await sixthRow.boundingBox();
  expect(box, 'Sixth Running row must have measurable browser geometry').not.toBeNull();
  expect(
    box.y + box.height <= 900,
    `Sixth Running row must remain above the 1280x900 fold: ${JSON.stringify(box)}`,
  ).toBe(true);
}

async function tabUntilFocused(page, locator, maxTabs = 40) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    const focused = await locator.evaluate((element) => element === document.activeElement);
    if (focused) return;
  }
  throw new Error(
    `Keyboard focus did not reach ${(await locator.getAttribute('aria-label')) || 'target'}.`,
  );
}

async function createOcrFixtureBuffer(page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111111';
    context.font = '700 58px Arial, sans-serif';
    context.fillText('GPS CAMERA', 820, 570);
    context.font = '700 64px Arial, sans-serif';
    context.fillText('LATITUDE 3.5244 N', 700, 670);
    context.fillText('LONGITUDE 98.7691 E', 700, 760);
    return canvas.toDataURL('image/png');
  });

  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function assertViewerTicketLoaded(page, ticketId) {
  await expect(page).toHaveURL(new RegExp(`/tickets/${ticketId}$`));

  const reviewMeta = page.locator('[aria-label="Ticket review metadata"]');
  const outcome = await Promise.race([
    reviewMeta.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'viewer'),
    page
      .getByText('Ticket could not be loaded', { exact: true })
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => 'error'),
    page.waitForTimeout(8500).then(() => 'timeout'),
  ]);

  if (outcome !== 'viewer') {
    const bodyText = await page.locator('body').innerText();
    const stage = bodyText.includes('Checking session…')
      ? 'auth-session'
      : bodyText.includes('Loading Ticket')
        ? 'ticket-load'
        : outcome === 'error'
          ? 'ticket-error'
          : 'unknown';
    throw new Error(
      `Viewer Ticket route failed at stage=${stage}, outcome=${outcome}, url=${page.url()}\n${bodyText}`,
    );
  }

  await expect(reviewMeta.getByText('Read only')).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
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

  test('Admin completes the Ticket lifecycle through OCR, resolve, archive, and restore', async ({
    page,
    context,
  }) => {
    test.setTimeout(180_000);

    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: APP_ORIGIN,
    });
    await login(page, accounts.admin);

    await page.getByRole('link', { name: 'New Ticket' }).click();
    await expect(page).toHaveURL(/\/generator\/new$/);

    await page.getByLabel('Title').fill(INCIDENT_TITLE);
    await page.getByLabel('Occur Time', { exact: true }).fill('2026-08-21T08:00');
    await page.getByLabel('Dispatch Time', { exact: true }).fill('2026-08-21T08:10');
    await page.getByLabel('PIC', { exact: true }).fill('T7 Operator');
    await page.getByLabel('Rootcause').fill('Fiber cut during maintenance');
    await page.locator('#cut-point').fill('KM 12 from Bandung hub');

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL((url) => /^\/generator\/[^/]+\/edit$/.test(new URL(url).pathname));
    const editorPath = new URL(page.url()).pathname.split('/');
    ticketId = editorPath.at(-2);
    expect(ticketId).toBeTruthy();
    expect(ticketId).not.toBe('new');

    await page.getByRole('button', { name: 'Mark Running' }).click();
    await expect(page.getByText('Ticket marked Running')).toBeVisible();

    await page.getByLabel('Event time', { exact: true }).fill('2026-08-21T08:30');
    await page.getByLabel('Progress update').fill('Team arrived at the Cut Point');
    await page.getByRole('button', { name: 'Add update' }).click();
    await expect(page.getByText('Team arrived at the Cut Point', { exact: true })).toBeVisible();

    const fixtureBuffer = await createOcrFixtureBuffer(page);
    await page.getByLabel('Choose Cut Point photo').setInputFiles({
      name: 't7-coordinate-fixture.png',
      mimeType: 'image/png',
      buffer: fixtureBuffer,
    });
    await page.getByRole('button', { name: 'Scan coordinates' }).click();
    const applyCoordinate = page.getByRole('button', { name: /Apply & verify/ });
    await expect(applyCoordinate).toBeVisible({ timeout: 120000 });
    await applyCoordinate.click();
    await expect(page.getByLabel('Latitude')).toHaveValue('3.5244');
    await expect(page.getByLabel('Longitude')).toHaveValue('98.7691');
    await expect(
      page.getByText(/Coordinate applied to editable Latitude\/Longitude fields/),
    ).toBeVisible();

    await page.getByLabel('Longitude').fill('98.7692');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Ticket saved')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Title')).toHaveValue(INCIDENT_TITLE);
    await expect(page.getByText('Team arrived at the Cut Point', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Latitude')).toHaveValue('3.5244');
    await expect(page.getByLabel('Longitude')).toHaveValue('98.7692');

    await page.getByRole('button', { name: 'Copy Report' }).click();
    await expect(page.getByText('Report copied')).toBeVisible();

    await seedRunningDensityTickets(5);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/running');
    const runningTable = page.getByRole('table');
    await expect(runningTable.getByText(INCIDENT_TITLE, { exact: true })).toBeVisible();
    await assertSixRunningRowsAboveFold(page);
    await page.getByRole('textbox', { name: /Search Running Tickets/ }).fill('00070001');
    await expect(runningTable.getByText(INCIDENT_TITLE, { exact: true })).toBeVisible();

    await page.goto('/cut-points');
    const incidentCard = page.locator('article').filter({ hasText: INCIDENT_TT });
    await expect(incidentCard).toBeVisible();
    await expect(page.locator(`.leaflet-marker-icon[title="${INCIDENT_TT}"]`)).toBeVisible();
    await incidentCard.getByRole('button', { name: 'Locate' }).click();
    await expect(page.locator('.leaflet-popup')).toContainText(INCIDENT_TT);

    await page.goto('/running');
    const incidentRow = page.getByRole('row').filter({ hasText: INCIDENT_TT });
    await expect(incidentRow).toBeVisible();
    await incidentRow.getByRole('button', { name: `Actions for ${INCIDENT_TT}` }).click();
    await page.getByRole('menuitem', { name: 'Resolve Ticket' }).click();
    await expect(page.getByText('Ticket resolved')).toBeVisible();
    await expect(page.getByText(INCIDENT_TITLE, { exact: true })).toHaveCount(0);

    await page.goto('/archive');
    await expect(page.getByRole('heading', { name: 'Archive & Restore', level: 2 })).toBeVisible();
    await expect(page.getByText(INCIDENT_TITLE, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: `Archive ${INCIDENT_TT}` }).click();
    await page.getByRole('button', { name: 'Archive Ticket' }).click();
    await expect(page.getByText('Ticket archived')).toBeVisible();
    await expect(page.getByText(INCIDENT_TITLE, { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Archived' }).click();
    await expect(page.getByText(INCIDENT_TITLE, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: `Restore ${INCIDENT_TT}` }).click();
    await page.getByRole('button', { name: 'Restore Ticket' }).click();
    await expect(page.getByText('Ticket restored')).toBeVisible();
    await expect(page.getByText(INCIDENT_TITLE, { exact: true })).toHaveCount(0);
  });

  test('Operator and Viewer UI restrictions match the role matrix', async ({ browser }) => {
    const operatorContext = await browser.newContext();
    const operatorPage = await operatorContext.newPage();
    await login(operatorPage, accounts.operator);
    await expect(operatorPage.getByRole('link', { name: 'New Ticket' })).toBeVisible();
    await expect(operatorPage.getByRole('link', { name: 'Archive & Restore' })).toHaveCount(0);
    await operatorPage.goto('/archive');
    await expect(operatorPage).toHaveURL(/\/dashboard$/);
    await operatorContext.close();

    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    await login(viewerPage, accounts.viewer);
    await expect(viewerPage.getByRole('link', { name: 'New Ticket' })).toHaveCount(0);
    await expect(viewerPage.getByRole('link', { name: 'Archive & Restore' })).toHaveCount(0);

    if (ticketId) {
      await viewerPage.goto(`/tickets/${ticketId}`);
      await assertViewerTicketLoaded(viewerPage, ticketId);
      await expect(viewerPage.getByRole('button', { name: 'Copy Report' })).toBeVisible();
      await expect(viewerPage.getByRole('button', { name: 'Save' })).toHaveCount(0);
      await expect(viewerPage.getByRole('link', { name: 'Edit Ticket' })).toHaveCount(0);
    }

    await viewerPage.goto('/generator/new');
    await expect(viewerPage).toHaveURL(/\/dashboard$/);
    await viewerPage.goto('/archive');
    await expect(viewerPage).toHaveURL(/\/dashboard$/);
    await viewerContext.close();
  });

  test('keyboard navigation and dialog focus management remain usable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page, accounts.admin);
    await page.evaluate(() => document.activeElement?.blur());

    const newTicketLink = page.getByRole('link', { name: 'New Ticket' });
    await tabUntilFocused(page, newTicketLink);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/generator\/new$/);

    const generatorSeparator = page.getByRole('separator');
    await expect(generatorSeparator).toBeVisible();
    await generatorSeparator.focus();
    await expect(generatorSeparator).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(generatorSeparator).toBeFocused();

    const titleInput = page.getByLabel('Title');
    await titleInput.focus();
    await page.keyboard.type('[T7 KEYBOARD QA]');
    await expect(titleInput).toHaveValue('[T7 KEYBOARD QA]');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/generator/new');
    await expect(page.getByRole('separator')).toHaveCount(0);
    await assertNoHorizontalOverflow(page, '/generator/new at 390px');

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/archive');
    const archiveButton = page.getByRole('button', { name: `Archive ${INCIDENT_TT}` });
    await expect(archiveButton).toBeVisible();
    await archiveButton.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Archive Ticket?' });
    await expect(dialog).toBeVisible();
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' });
    const confirmButton = dialog.getByRole('button', { name: 'Archive Ticket' });
    await expect(cancelButton).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(confirmButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancelButton).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(archiveButton).toBeFocused();
  });

  test('primary routes pass responsive overflow and serious axe checks', async ({ page }) => {
    await login(page, accounts.admin);
    const routes = [
      '/dashboard',
      '/generator/new',
      '/running',
      '/cut-points',
      '/archive',
      ...(ticketId ? [`/tickets/${ticketId}`] : []),
    ];
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

        if (route === '/generator/new') {
          const separator = page.getByRole('separator');
          if (viewport.width >= 1280) await expect(separator).toBeVisible();
          else await expect(separator).toHaveCount(0);
        }
      }
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await assertNoSeriousAxeViolations(page, route);
    }
  });
});
