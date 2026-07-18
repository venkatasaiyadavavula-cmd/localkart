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
  await page.getByRole('button', { name: /start working/i }).click();
  await page.waitForURL(/\/work/, { timeout: 30_000 });
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

test('delivery_staff cannot access product routes or Add button', async ({ page, request }) => {
  const sellerToken = await getSellerToken(request);
  const suffix = `${Date.now()}`.slice(-6);
  const staffId = `sw_guard_${suffix}`;
  const password = 'GuardStaff@1';

  const create = await request.post(`${API}/seller/staff`, {
    headers: authHeaders(sellerToken),
    data: {
      name: 'Guard Delivery',
      phone: `+9198762${suffix}`,
      role: 'delivery_staff',
      staffId,
      password,
    },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const created = await create.json();
  const staffDbId = created?.id ?? created?.data?.id;

  await clearAuth(page);
  await fillStaffLogin(page, staffId, password);

  await page.goto('/work/products', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/work\/?$/, { timeout: 15_000 });
  expect(page.url()).toMatch(/\/work\/?$/);

  await page.goto('/work/products/new', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/work\/?$/, { timeout: 15_000 });

  if (staffDbId) {
    await request.delete(`${API}/seller/staff/${staffDbId}`, {
      headers: authHeaders(sellerToken),
    });
  }
});
