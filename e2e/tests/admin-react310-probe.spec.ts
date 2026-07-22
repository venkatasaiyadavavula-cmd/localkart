import { test, expect } from '@playwright/test';
import { attachConsoleWatcher, loginAdmin } from '../helpers';

const ADMIN_ROUTES = [
  '/admin',
  '/admin/sellers',
  '/admin/products',
  '/admin/commissions',
  '/admin/disputes',
  '/admin/customers',
  '/admin/settings',
];

for (const route of ADMIN_ROUTES) {
  test(`admin route loads without React errors: ${route}`, async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await loginAdmin(page);
    await page.goto(route, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
    const reactErrors = errors.filter((e) => /React error|Minified React error|hooks/i.test(e));
    expect(reactErrors, `React errors on ${route}: ${reactErrors.join(' | ')}`).toEqual([]);
  });
}

test('admin products all tabs without React errors', async ({ page }) => {
  const errors = await attachConsoleWatcher(page);
  await loginAdmin(page);
  await page.goto('/admin/products', { waitUntil: 'networkidle' });
  for (const tab of ['Pending', 'Approved', 'Rejected', 'All']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await page.waitForTimeout(2000);
  }
  const reactErrors = errors.filter((e) => /React error|Minified React error|hooks/i.test(e));
  expect(reactErrors, reactErrors.join(' | ')).toEqual([]);
});

test('admin disputes all tabs without React errors', async ({ page }) => {
  const errors = await attachConsoleWatcher(page);
  await loginAdmin(page);
  await page.goto('/admin/disputes', { waitUntil: 'networkidle' });
  for (const tab of ['Pending', 'Approved', 'Rejected', 'All']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await page.waitForTimeout(2000);
  }
  const reactErrors = errors.filter((e) => /React error|Minified React error|hooks/i.test(e));
  expect(reactErrors, reactErrors.join(' | ')).toEqual([]);
});
