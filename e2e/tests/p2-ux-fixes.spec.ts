/**
 * P2 UX fixes — wishlist cache + clear cart on production.
 */
import { test, expect } from '../qa-fixtures';
import { CREDS, loginCustomer, clearAuth } from '../helpers';

test.describe.configure({ timeout: 120_000 });

test.use({ viewport: { width: 390, height: 844 } });

test('clear cart shows empty state immediately', async ({ page }) => {
  await clearAuth(page);
  await loginCustomer(page);

  await page.goto('/browse?q=tata', { waitUntil: 'networkidle' });
  await page.locator('a[href*="/product/"]').first().click();
  await page.waitForURL(/\/product\//);
  await page.getByRole('button', { name: /add to cart/i }).first().click();
  await page.waitForTimeout(1500);

  await page.goto('/cart', { waitUntil: 'networkidle' });
  await expect(page.getByText(/shopping cart/i)).toBeVisible();

  await page.getByTestId('clear-cart').click();
  await expect(page.getByText(/your cart is empty/i)).toBeVisible({ timeout: 5_000 });
});

test('wishlist remove on product page reflects on /wishlist', async ({ page }) => {
  await clearAuth(page);
  await loginCustomer(page);

  await page.goto('/browse?q=tata', { waitUntil: 'networkidle' });
  await page.locator('a[href*="/product/"]').first().click();
  await page.waitForURL(/\/product\//);

  const heart = page.locator('button').filter({ has: page.locator('svg.lucide-heart') }).first();
  await heart.click();
  await page.waitForTimeout(1000);

  await page.goto('/wishlist', { waitUntil: 'networkidle' });
  await expect(page.getByText(/wishlist empty/i)).not.toBeVisible({ timeout: 10_000 });

  await page.goto(page.url().replace('/wishlist', '') || '/browse?q=tata');
  await page.locator('a[href*="/product/"]').first().click();
  await heart.click();
  await page.waitForTimeout(1000);

  await page.goto('/wishlist', { waitUntil: 'networkidle' });
  await expect(page.getByText(/wishlist empty/i)).toBeVisible({ timeout: 10_000 });
});

test('cancel order visible on fresh pending_otp order', async ({ page }) => {
  await clearAuth(page);
  await loginCustomer(page);

  await page.goto('/browse?q=tata', { waitUntil: 'networkidle' });
  await page.locator('a[href*="/product/"]').first().click();
  await page.getByRole('button', { name: /add to cart/i }).first().click();
  await page.waitForTimeout(1500);

  await page.goto('/checkout', { waitUntil: 'networkidle' });
  await page.locator('#name, input[name="name"]').first().fill('P2 Cancel QA');
  await page.locator('#phone, input[name="phone"]').first().fill(CREDS.customer.phone);
  await page.locator('#address, textarea[name="address"], input[name="address"]').first().fill('RTC Bus Stand, Kadapa');
  await page.locator('#pincode, input[name="pincode"]').first().fill('516001');

  const [orderRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/orders') && r.request().method() === 'POST'),
    page.getByRole('button', { name: /place cod order|place order/i }).click(),
  ]);
  expect(orderRes.status()).toBe(201);
  const body = await orderRes.json();
  const orderId = (body.data ?? body).id;

  await page.goto(`/orders/${orderId}`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: /cancel order/i })).toBeVisible({ timeout: 15_000 });
});
