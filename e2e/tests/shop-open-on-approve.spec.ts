/**
 * Verify shop is open to customers immediately after admin approval (no manual toggle).
 * Run after deploy: SITE_URL=https://localkart.store API_URL=https://api.localkart.store/api/v1 npx playwright test tests/shop-open-on-approve.spec.ts --project=desktop
 */
import { test, expect } from '../qa-fixtures';
import { API, CREDS, clearAuth, submitLoginForm } from '../helpers';

const PENDING_HEADING = /Your shop registration is under review/i;

test.describe.configure({ mode: 'serial', timeout: 300_000 });

test('approved shop is open without seller toggle; manual close still works', async ({ page, context }) => {
  const suffix = String(Date.now()).slice(-9);
  const sellerPhone = `8${suffix}`;
  const customerPhone = `7${suffix}`;
  const password = 'OpenShopTest@123';
  const shopName = `Open Test Shop ${suffix}`;
  const productName = `Open Test Product ${suffix}`;

  console.log('SELLER_PHONE:', sellerPhone);
  console.log('CUSTOMER_PHONE:', customerPhone);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Customer + seller register
  await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `Seller ${suffix}`, phone: sellerPhone, password }),
  });
  await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `Customer ${suffix}`, phone: customerPhone, password }),
  });

  // Seller onboarding (minimal)
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 14.4673, longitude: 78.8242 });
  await clearAuth(page);
  await page.goto('/login?intent=seller', { waitUntil: 'domcontentloaded' });
  await page.locator('#phone').fill(sellerPhone);
  await page.locator('#password').fill(password);
  await submitLoginForm(page);
  await page.waitForURL(/\/seller-onboarding/, { timeout: 30_000 });

  await page.locator('#name').fill(shopName);
  await page.locator('#contactPhone').fill(`9${suffix.slice(-9)}`);
  await page.locator('#contactEmail').fill(`open${suffix}@test.local`);
  await page.getByRole('button', { name: /^Next$/i }).click();
  await page.locator('#address').fill('123 RTC Bus Stand Road');
  await page.locator('#pincode').fill('516001');
  await page.getByRole('button', { name: /Pin Your Shop Location/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByPlaceholder(/Search for area/i).fill('Nagarajupeta Kadapa');
  await dialog.getByRole('button').nth(1).click();
  await dialog.getByRole('button', { name: /Confirm Location/i }).click({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: /Location Selected/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /^Next$/i }).click();

  const createShopRes = page.waitForResponse(
    (r) => r.url().includes('/seller/shop') && r.request().method() === 'POST',
    { timeout: 90_000 },
  );

  // Documents — optional uploads skipped; submission may auto-complete on review step
  await page.getByRole('button', { name: /^Next$/i }).click();
  await page
    .getByRole('button', { name: /Submit for Approval/i })
    .click({ timeout: 5000 })
    .catch(() => {});

  const createRes = await createShopRes;
  expect(createRes.ok(), await createRes.text()).toBeTruthy();
  await expect(page.getByRole('heading', { name: PENDING_HEADING })).toBeVisible({ timeout: 25_000 });

  const sellerLogin = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone: sellerPhone, password }),
  });
  const sellerJson = await sellerLogin.json();
  const sellerToken = sellerJson.accessToken || sellerJson.data?.accessToken;
  const profile = await fetch(`${API}/users/profile`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  }).then((r) => r.json());
  const shopId = profile.data?.shop?.id || profile.shop?.id || profile.shopId;

  const adminLogin = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone: CREDS.admin.phone, password: CREDS.admin.password }),
  });
  const adminJson = await adminLogin.json();
  const adminToken = adminJson.accessToken || adminJson.data?.accessToken;

  const approveRes = await fetch(`${API}/admin/shops/${shopId}/approve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const approveBody = await approveRes.json();
  expect(approveRes.ok, JSON.stringify(approveBody)).toBeTruthy();
  expect(approveBody.manualOverride).toBe('none');

  // Create + approve product (no seller shop toggle)
  const prodRes = await fetch(`${API}/catalog/seller/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: productName,
      description: 'test',
      price: 25,
      stock: 5,
      categoryType: 'groceries',
    }),
  });
  const prod = await prodRes.json();
  const productId = prod.id || prod.data?.id;
  await fetch(`${API}/admin/products/${productId}/approve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const shopPublic = await fetch(`${API}/seller/shop/id/${shopId}`).then((r) => r.json());
  const shopData = shopPublic.data ?? shopPublic;
  expect(shopData.isCurrentlyOpen, 'shop should be open after approval without toggle').toBe(true);

  const custLogin = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone: customerPhone, password }),
  });
  const custJson = await custLogin.json();
  const custToken = custJson.accessToken || custJson.data?.accessToken;

  const addRes = await fetch(`${API}/cart/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${custToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  expect(addRes.ok, await addRes.text()).toBeTruthy();

  // Seller manually closes — customers should be blocked again
  await fetch(`${API}/seller/shop/toggle`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${sellerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ manualOverride: 'force_closed' }),
  });

  const addWhenClosed = await fetch(`${API}/cart/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${custToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  expect(addWhenClosed.status).toBe(400);
  const closedBody = await addWhenClosed.json();
  expect(closedBody.message).toMatch(/closed/i);
});
