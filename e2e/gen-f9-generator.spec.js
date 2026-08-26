import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const PROJECT_ID = 'demo-nocreport';
const AUTH_ORIGIN = 'http://127.0.0.1:9099';
const FIRESTORE_ORIGIN = 'http://127.0.0.1:8080';
const PASSWORD = 'NocReport-F9-E2E-2026!';
const MSG_EXPECTED_PATH = process.env.GEN_F9_MSG_EXPECTED ?? '';
const MSG_FIXTURES = MSG_EXPECTED_PATH ? JSON.parse(readFileSync(MSG_EXPECTED_PATH, 'utf8')) : null;

const admin = {
  email: 'f9-admin@nocreport.test',
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
          displayName: { stringValue: 'GEN-F9 Admin' },
        },
      }),
    }),
    'Seed GEN-F9 Admin profile',
  );
}

async function seedDuplicateTicket({
  id = 'f9-existing-duplicate',
  tt = 'INC-20260827-90090002',
} = {}) {
  const occurAt = '2026-08-27T01:00:00.000Z';
  const updatedAt = '2026-08-27T01:20:00.000Z';
  const url = `${FIRESTORE_ORIGIN}/v1/projects/${PROJECT_ID}/databases/(default)/documents/tickets/${id}`;
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
          title: { stringValue: `[F9-EXISTING] LINK DOWN [TT : ${tt}]` },
          externalTtNumber: { stringValue: tt },
          status: { stringValue: 'RUNNING' },
          revision: { integerValue: '1' },
          occurAt: { timestampValue: occurAt },
          dispatchAt: { timestampValue: occurAt },
          pic: { stringValue: 'F9 Existing PIC' },
          rootcause: { stringValue: 'Still Investigation' },
          cutPoint: { stringValue: 'Still Investigation' },
          hasCoordinates: { booleanValue: false },
          createdAt: { timestampValue: occurAt },
          updatedAt: { timestampValue: updatedAt },
        },
      }),
    }),
    'Seed GEN-F9 duplicate Ticket',
  );
  return { id, tt };
}

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(admin.email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openNewGenerator(page) {
  await page.goto('/generator/new');
  await expect(page.getByRole('heading', { name: 'New Ticket' })).toBeVisible();
}

async function loadOutlookMsg(page, filePath) {
  const importSection = page.locator('#generator-smart-import');
  await importSection.getByRole('button', { name: 'Outlook .msg' }).click();
  await importSection.getByLabel('Outlook email file').setInputFiles(filePath);
  await expect(importSection.getByText('OUTLOOK_MSG', { exact: true })).toBeVisible();
  await expect(importSection.getByText('Review detected values before applying')).toBeVisible();
  return importSection;
}

async function resetF9Data() {
  await clearFirestore();
  await seedProfile(admin);
}

test.beforeAll(async () => {
  await clearFirestore();
  await createAuthAccount(admin);
  await seedProfile(admin);
});

test.describe.serial('GEN-F9 integrated Generator hardening', () => {
  test('imports runtime .msg Sent metadata and never uses quoted Sent body text as Dispatch fallback', async ({
    page,
  }) => {
    test.skip(!MSG_FIXTURES, 'GEN_F9_MSG_EXPECTED runtime fixture metadata is not available.');
    await resetF9Data();
    await login(page);
    await openNewGenerator(page);

    const sentImport = await loadOutlookMsg(page, MSG_FIXTURES.sent.file);
    expect(MSG_FIXTURES.sent.dispatchSource).toBe('message_metadata');
    await expect(sentImport.getByText(/message_metadata · exact/i)).toBeVisible();
    await expect(sentImport.getByText(MSG_FIXTURES.sent.dispatchAt, { exact: true })).toBeVisible();
    await sentImport.getByRole('button', { name: /Apply selected/ }).click();
    await expect(page.getByLabel('Dispatch Time', { exact: true })).toHaveValue(
      MSG_FIXTURES.sent.dispatchAt,
    );
    await expect(page).toHaveURL(/\/generator\/new$/);

    await page.getByLabel('Dispatch Time', { exact: true }).fill('');
    const quotedImport = await loadOutlookMsg(page, MSG_FIXTURES.quotedSent.file);
    if (MSG_FIXTURES.quotedSent.dispatchSource === 'message_metadata') {
      await expect(quotedImport.getByText(/message_metadata · exact/i)).toBeVisible();
      await expect(
        quotedImport.getByText(MSG_FIXTURES.quotedSent.dispatchAt, { exact: true }),
      ).toBeVisible();
    } else {
      await expect(quotedImport.locator('label').filter({ hasText: 'Dispatch Time' })).toHaveCount(
        0,
      );
      await expect(page.getByLabel('Dispatch Time', { exact: true })).toHaveValue('');
    }
  });

  test('does not overwrite a dirty Dispatch Time until the operator explicitly selects replacement', async ({
    page,
  }) => {
    test.skip(!MSG_FIXTURES, 'GEN_F9_MSG_EXPECTED runtime fixture metadata is not available.');
    await resetF9Data();
    await login(page);
    await openNewGenerator(page);

    const currentDispatch = '2026-08-27T12:34';
    await page.getByLabel('Dispatch Time', { exact: true }).fill(currentDispatch);
    const importSection = await loadOutlookMsg(page, MSG_FIXTURES.sent.file);
    const dispatchReview = importSection.locator('label').filter({ hasText: 'Dispatch Time' });
    await expect(dispatchReview).toContainText('replaces current value');
    const dispatchCheckbox = dispatchReview.getByRole('checkbox');
    await expect(dispatchCheckbox).not.toBeChecked();
    await expect(page.getByLabel('Dispatch Time', { exact: true })).toHaveValue(currentDispatch);

    await dispatchCheckbox.check();
    await importSection.getByRole('button', { name: /Apply selected/ }).click();
    await expect(page.getByLabel('Dispatch Time', { exact: true })).toHaveValue(
      MSG_FIXTURES.sent.dispatchAt,
    );
  });

  test('preserves a three-endpoint path through Unified Import into the canonical report preview', async ({
    page,
  }) => {
    await resetF9Data();
    await login(page);
    await openNewGenerator(page);

    const title =
      '[MANDAU] LINK DOWN AT DWDM 100901_F9_A <> 100902_F9_B <> 100903_F9_C [TT : INC-20260827-90090001]';
    const report = `*${title}*\nOccur Time = 27/08/2026 08:00\nDispatch Time = 27/08/2026 08:05\nPIC = F9 Operator\nRootcause = Still Investigation\nCut Point = Still Investigation`;
    const importSection = page.locator('#generator-smart-import');
    await importSection.getByLabel('Existing report').fill(report);
    await expect(importSection.getByText('Review detected values before applying')).toBeVisible();
    await importSection.getByRole('button', { name: /Apply selected/ }).click();

    await expect(page.locator('#ticket-title')).toHaveValue(title);
    const preview = page.getByLabel('Generated NOC report');
    await expect(preview).toContainText('100901_F9_A <> 100902_F9_B <> 100903_F9_C');
    await expect(preview).toContainText('INC-20260827-90090001');
  });

  test('surfaces bounded exact-TT duplicate evidence and requires explicit Create anyway', async ({
    page,
  }) => {
    await resetF9Data();
    const duplicate = await seedDuplicateTicket();
    await login(page);
    await openNewGenerator(page);

    await page.locator('#ticket-title').fill(`[F9-NEW] LINK DOWN [TT : ${duplicate.tt}]`);
    await page.getByLabel('Occur Time', { exact: true }).fill('2026-08-27T08:05');

    const duplicatePanel = page.locator('.generator-duplicate-related');
    await expect(
      duplicatePanel.getByRole('heading', { name: 'Duplicate & Related Tickets' }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(duplicatePanel.getByText(duplicate.tt, { exact: true })).toBeVisible();
    await expect(
      duplicatePanel.getByText('Exact external TT match', { exact: true }),
    ).toBeVisible();
    await expect(duplicatePanel.getByRole('button', { name: 'Create anyway' })).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/generator\/new$/);
    await duplicatePanel.getByRole('button', { name: 'Create anyway' }).click();
    await page.waitForURL((url) => /^\/generator\/[^/]+\/edit$/.test(new URL(url).pathname));
  });

  test('restores an interrupted local draft without creating a Firestore Ticket', async ({ page }) => {
    await resetF9Data();
    await login(page);
    await openNewGenerator(page);

    const draftTitle = '[F9-DRAFT] LINK DOWN [TT : INC-20260827-90090004]';
    await page.locator('#ticket-title').fill(draftTitle);
    await page.getByLabel('Occur Time', { exact: true }).fill('2026-08-27T10:00');
    await page.getByLabel('PIC', { exact: true }).fill('F9 Recovery PIC');
    await page.getByLabel('Progress update').fill('Unsubmitted F9 recovery progress');

    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem('nocreport-ticket-draft:new')))
      .toContain(draftTitle);

    await page.reload();
    await expect(page.getByLabel('Draft recovery')).toBeVisible();
    await page.getByRole('button', { name: 'Restore' }).click();
    await expect(page.locator('#ticket-title')).toHaveValue(draftTitle);
    await expect(page.getByLabel('PIC', { exact: true })).toHaveValue('F9 Recovery PIC');
    await expect(page.getByLabel('Progress update')).toHaveValue('Unsubmitted F9 recovery progress');
    await expect(page).toHaveURL(/\/generator\/new$/);
  });

  test('records and renders compact revision diff after explicit Ticket save', async ({ page }) => {
    await resetF9Data();
    await login(page);
    await openNewGenerator(page);

    await page
      .locator('#ticket-title')
      .fill('[F9-REVISION] LINK DOWN [TT : INC-20260827-90090005]');
    await page.getByLabel('Occur Time', { exact: true }).fill('2026-08-27T11:00');
    await page.getByLabel('PIC', { exact: true }).fill('F9 Revision PIC A');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL((url) => /^\/generator\/[^/]+\/edit$/.test(new URL(url).pathname));

    await page.getByLabel('PIC', { exact: true }).fill('F9 Revision PIC B');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Revision 2', { exact: true })).toBeVisible();
    await page.reload();

    const history = page.getByLabel('Revision history');
    await expect(history.getByRole('heading', { name: 'Revision History' })).toBeVisible();
    await expect(history.getByText('Revision 1 → 2', { exact: true })).toBeVisible();
    await expect(history.getByText('PIC', { exact: true })).toBeVisible();
    await expect(history.getByText('F9 Revision PIC A → F9 Revision PIC B', { exact: true })).toBeVisible();
  });

  test('uses Ctrl+S as explicit Generator Save without invoking a lifecycle transition', async ({ page }) => {
    await resetF9Data();
    await login(page);
    await openNewGenerator(page);

    await page
      .locator('#ticket-title')
      .fill('[F9-SHORTCUT] LINK DOWN [TT : INC-20260827-90090006]');
    await page.getByLabel('Occur Time', { exact: true }).fill('2026-08-27T12:00');
    await page.keyboard.press('Control+S');
    await page.waitForURL((url) => /^\/generator\/[^/]+\/edit$/.test(new URL(url).pathname));
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  });
});
