/**
 * P0 checkout hotfix verification — place COD order end-to-end.
 */
import { test, expect } from '../qa-fixtures';
import { CREDS, loginCustomer, clearAuth } from '../helpers';

test.describe.configure({ timeout: 180_000 });

test('checkout places COD order without shippingAddress validation error', async ({ page }) => {
  await clearAuth(page);
  await loginCustomer(page);

  await page.goto('/browse?q=tata', { waitUntil: 'domcontentloaded' });
  const productLink = page.locator('a[href*="/product/"]').first();
  await productLink.waitFor({ state: 'visible', timeout: 20_000 });
  await productLink.click();
  await page.waitForURL(/\/product\//, { timeout: 15_000 });

  const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
  await expect(addBtn).toBeEnabled({ timeout: 15_000 });
  await addBtn.click();
  await page.waitForTimeout(1500);

  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  if (page.url().includes('/login')) {
    await loginCustomer(page);
    await page.goto('/checkout');
  }

  await page.locator('#name, input[name="name"]').first().fill('Checkout Hotfix QA');
  await page.locator('#phone, input[name="phone"]').first().fill(CREDS.customer.phone);
  await page.locator('#address, textarea[name="address"], input[name="address"]').first().fill('RTC Bus Stand, Kadapa');
  await page.locator('#pincode, input[name="pincode"]').first().fill('516001');

  const [orderRes] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/orders') && r.request().method() === 'POST',
      { timeout: 45_000 },
    ),
    page.getByRole('button', { name: /place cod order|place order/i }).click(),
  ]);

  expect(orderRes.status(), await orderRes.text()).toBe(201);
  const body = await orderRes.json();
  const order = body.data ?? body;
  expect(order.id).toBeTruthy();

  await page.waitForURL(/\/orders\/track|\/orders\//, { timeout: 30_000 });

  await page.goto('/orders', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/checkout hotfix|tata|order/i).first()).toBeVisible({ timeout: 15_000 });
});
