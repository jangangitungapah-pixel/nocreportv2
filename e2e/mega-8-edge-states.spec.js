import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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

async function assertNoSeriousAxeViolations(page, label) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact),
  );
  expect(violations, `${label} has serious/critical axe violations`).toEqual([]);
}

test('MEGA-8 Login and recovery states stay responsive, keyboard-safe, and accessible', async ({
  page,
}) => {
  test.setTimeout(90_000);

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
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeEnabled();
    await assertNoHorizontalOverflow(page, `Login at ${viewport.width}px`);

    await page.goto('/mega-8-route-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Dashboard' })).toBeVisible();
    await assertNoHorizontalOverflow(page, `Not Found at ${viewport.width}px`);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/login');
  const email = page.getByLabel('Email');
  const password = page.getByLabel('Password');
  const submit = page.getByRole('button', { name: 'Sign in' });
  await expect(email).toBeEnabled();

  await page.keyboard.press('Tab');
  await expect(email).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();
  await assertNoSeriousAxeViolations(page, 'Login desktop');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeEnabled();
  await assertNoSeriousAxeViolations(page, 'Login mobile');

  await page.goto('/mega-8-route-does-not-exist');
  await assertNoSeriousAxeViolations(page, 'Not Found mobile');
});
