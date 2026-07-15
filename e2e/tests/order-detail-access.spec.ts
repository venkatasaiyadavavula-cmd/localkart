import { test, expect } from '../qa-fixtures';
import { attachConsoleWatcher, clearAuth, loginCustomer, API } from '../helpers';
import { getCustomerOrders, getCustomerToken } from '../api-helpers';

test.describe('Order detail access regression', () => {
  test('owning customer: API 200 + no 403 on order detail, track, profile', async ({
    page,
    request,
  }) => {
    const token = await getCustomerToken(request);
    const orders = await getCustomerOrders(request, token);
    const order = orders[0];
    expect(order?.id, 'QA customer needs at least one order').toBeTruthy();
    const orderId = order.id as string;

    const ownRes = await request.get(`${API}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(ownRes.status(), 'GET /orders/:id for owning customer').toBe(200);

    const phoneB = `9876${String(Date.now()).slice(-6)}`;
    const reg = await request.post(`${API}/auth/register`, {
      data: {
        name: 'Cross Customer QA',
        phone: phoneB,
        password: 'CrossTest@123',
        role: 'customer',
      },
    });
    expect(reg.ok(), 'register temp customer B').toBeTruthy();
    const regBody = await reg.json();
    const tokenB = regBody.accessToken ?? regBody.data?.accessToken;
    const denyRes = await request.get(`${API}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(denyRes.status(), 'different customer must get 403').toBe(403);

    await clearAuth(page);
    await loginCustomer(page);

    for (const route of [`/orders/${orderId}`, `/orders/track?id=${orderId}`, '/profile']) {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      const failed: string[] = [];
      page.on('response', (response) => {
        const status = response.status();
        if (status >= 400 && response.url().includes(`/orders/${orderId}`)) {
          failed.push(`${status} ${response.url()}`);
        }
      });

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      expect(failed, `order API failures on ${route}`).toEqual([]);
      const console403 = errors.filter((e) => /403|Forbidden/i.test(e));
      expect(console403, `403 console errors on ${route}`).toEqual([]);
    }
  });
});
