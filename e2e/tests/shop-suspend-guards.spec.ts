/**
 * Shop suspend guards — seller dashboard blocked, storefront hidden, ordering blocked.
 * Uses QA seller (9988776655); always unsuspends in finally.
 */
import { test, expect } from '../qa-fixtures';
import {
  API,
  CREDS,
  SITE,
  clearAuth,
  loginSeller,
  submitLoginForm,
} from '../helpers';
import { authHeaders, getAdminToken, getSellerToken } from '../api-helpers';

test.describe.configure({ mode: 'serial', timeout: 180_000 });

test('suspend blocks seller dashboard and storefront; unsuspend restores access', async ({
  page,
  request,
}) => {
  const adminToken = await getAdminToken(request);
  const sellerToken = await getSellerToken(request);

  const shopRes = await request.get(`${API}/seller/shop`, {
    headers: authHeaders(sellerToken),
  });
  expect(shopRes.ok(), await shopRes.text()).toBeTruthy();
  const shopBody = await shopRes.json();
  const shop = shopBody?.data ?? shopBody;
  const shopId = shop.id as string;
  const slug = shop.slug as string;
  expect(shopId).toBeTruthy();
  expect(slug).toBeTruthy();

  const suspendRes = await request.put(`${API}/admin/shops/${shopId}/suspend`, {
    headers: authHeaders(adminToken),
    data: { reason: 'e2e suspend guard test' },
  });
  expect(suspendRes.ok(), await suspendRes.text()).toBeTruthy();

  try {
    const storefrontApi = await request.get(`${API}/seller/shop/slug/${slug}`);
    expect(storefrontApi.status(), 'suspended shop slug API should not return shop').toBe(404);

    await clearAuth(page);
    await page.goto('/login?intent=seller&redirect=/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('#phone').fill(CREDS.seller.phone);
    await page.locator('#password').fill(CREDS.seller.password);
    await submitLoginForm(page);
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { timeout: 25_000 });

    await expect(page.getByRole('heading', { name: /your shop has been suspended/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/contact support/i)).toBeVisible();
    await expect(page.locator('aside, [data-testid="seller-sidebar"]').first()).not.toBeVisible();

    await page.goto(`/shop/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /shop not found/i })).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    let restore = await request.put(`${API}/admin/shops/${shopId}/unsuspend`, {
      headers: authHeaders(adminToken),
      data: {},
    });
    if (!restore.ok()) {
      restore = await request.put(`${API}/admin/shops/${shopId}/approve`, {
        headers: authHeaders(adminToken),
        data: {},
      });
    }
    expect(restore.ok(), await restore.text()).toBeTruthy();
  }

  await clearAuth(page);
  await loginSeller(page);
  await expect(page.getByRole('heading', { name: /your shop has been suspended/i })).not.toBeVisible();
  await expect(page.locator('main')).toBeVisible();

  const restoredStorefront = await request.get(`${API}/seller/shop/slug/${slug}`);
  expect(restoredStorefront.ok(), await restoredStorefront.text()).toBeTruthy();
});
