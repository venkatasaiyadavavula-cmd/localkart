import { test, expect } from '@playwright/test';
import { API, CREDS, loginCustomer, loginStaff, clearAuth } from '../helpers';

test.describe('Production failure regressions', () => {
  test('Issue 1: no 403 from seller/shop when customer opens cart from wishlist', async ({ page }) => {
    const failures: { url: string; status: number; body: string }[] = [];
    page.on('response', async (res) => {
      if (res.status() === 403) {
        failures.push({
          url: res.url(),
          status: res.status(),
          body: (await res.text().catch(() => '')).slice(0, 300),
        });
      }
    });

    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/wishlist', { waitUntil: 'networkidle' });

    const cartLink = page.locator('a[href="/cart"]').first();
    await cartLink.scrollIntoViewIfNeeded();
    await cartLink.click({ force: true });
    await page.waitForURL(/\/cart/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle');

    const sellerShop403 = failures.filter((f) => f.url.includes('/seller/shop'));
    expect(sellerShop403, JSON.stringify(sellerShop403)).toHaveLength(0);
  });

  test('Issue 2: staff login reaches /work', async ({ page }) => {
    await clearAuth(page);
    const start = Date.now();
    await loginStaff(page);
    const ms = Date.now() - start;
    console.log(`Staff login completed in ${ms}ms`);
    expect(page.url()).toMatch(/\/work\/?$/);
    expect(ms).toBeLessThan(40_000);
  });

  test('Issue 3: no websocket errors on order track page', async ({ page, request }) => {
    const wsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /websocket|socket/i.test(msg.text())) {
        wsErrors.push(msg.text());
      }
    });

    await clearAuth(page);
    await loginCustomer(page);

    const loginRes = await request.post(`${API}/auth/login`, {
      data: { phone: CREDS.customer.phone, password: CREDS.customer.password },
    });
    const loginJson = await loginRes.json();
    const token = loginJson.data?.accessToken ?? loginJson.accessToken;
    const ordersRes = await request.get(`${API}/orders?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ordersJson = await ordersRes.json();
    const orders = ordersJson.data?.data ?? ordersJson.data ?? ordersJson.orders ?? [];
    const orderId = Array.isArray(orders) ? orders[0]?.id : undefined;
    if (!orderId) {
      test.skip(true, 'no orders');
      return;
    }

    await page.goto(`/orders/track?id=${orderId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    expect(wsErrors, wsErrors.join(' | ')).toHaveLength(0);
  });
});
