/**
 * Staff route guards — seller dashboard redirect + delivery_staff product access.
 */
import { test, expect } from '../qa-fixtures';
import { API, clearAuth } from '../helpers';
import { authHeaders, getSellerToken } from '../api-helpers';

async function fillStaffLogin(
  page: import('@playwright/test').Page,
  staffId: string,
  password: string,
) {
  await page.goto('/work/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  const idEl = page.locator('#staffId');
  const passEl = page.locator('#password');
  await idEl.click();
  await idEl.pressSequentially(staffId, { delay: 15 });
  await passEl.click();
  await passEl.pressSequentially(password, { delay: 15 });
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/seller/staff/login') && r.request().method() === 'POST',
      { timeout: 40_000 },
    ),
    page.getByRole('button', { name: /start working/i }).click(),
  ]);
  if (!response.ok()) {
    throw new Error(`Staff login failed (${response.status()}): ${(await response.text()).slice(0, 200)}`);
  }
  await page.waitForURL(/\/work\/?$/, { timeout: 30_000 });
}

test.describe.configure({ mode: 'serial', timeout: 180_000 });

test('staff session is redirected away from seller dashboard routes', async ({ page }) => {
  await clearAuth(page);
  await fillStaffLogin(page, 'qa_test_worker', 'Test@1234');

  for (const path of ['/dashboard/staff', '/dashboard/shop-settings', '/dashboard/commission', '/dashboard/earnings']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/work\/?$/, { timeout: 15_000 });
    expect(page.url(), path).toMatch(/\/work\/?$/);
    const crash = await page.getByText(/application error|client-side exception/i).isVisible().catch(() => false);
    expect(crash, `${path} should not crash`).toBe(false);
  }
});

test('employee staff can access work product routes', async ({ page }) => {
  await clearAuth(page);
  await fillStaffLogin(page, 'qa_test_worker', 'Test@1234');

  await page.goto('/work/products', { waitUntil: 'domcontentloaded' });
  await expect(page.url()).toMatch(/\/work\/products/);

  await page.goto('/work/products/new', { waitUntil: 'domcontentloaded' });
  await expect(page.url()).toMatch(/\/work\/products\/new/);
});
