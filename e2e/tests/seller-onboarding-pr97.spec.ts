/**
 * PR #97 production verification — onboarding gate cache + map pin interaction.
 * Run: SITE_URL=https://localkart.store API_URL=https://api.localkart.store/api/v1 npx playwright test tests/seller-onboarding-pr97.spec.ts --project=desktop
 */
import { test, expect } from '../qa-fixtures';
import { API, clearAuth, submitLoginForm } from '../helpers';

const PENDING_HEADING = /Your shop registration is under review/i;
const SETUP_HEADING = /Set Up Your Shop/i;

test.describe.configure({ mode: 'serial', timeout: 300_000 });

test('PR97: seller onboarding pending screen + map pin + reload', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 14.4673, longitude: 78.8242 });
  const suffix = String(Date.now()).slice(-9);
  const phone = `8${suffix}`;
  const password = 'TestSeller@123';
  const shopName = `E2E PR97 Shop ${suffix}`;
  const contactPhone = `9${suffix.slice(-9)}`;

  console.log('TEST_SELLER_PHONE:', phone);
  console.log('TEST_SHOP_NAME:', shopName);

  // Register via API (fresh account)
  const regHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.QA_THROTTLE_BYPASS_TOKEN) {
    regHeaders['X-QA-Throttle-Bypass'] = process.env.QA_THROTTLE_BYPASS_TOKEN;
  }
  const reg = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: regHeaders,
    body: JSON.stringify({ name: `E2E Seller ${suffix}`, phone, password }),
  });
  expect(reg.ok, await reg.text()).toBeTruthy();

  await clearAuth(page);
  await page.goto('/login?intent=seller', { waitUntil: 'domcontentloaded' });
  await page.locator('#phone').fill(phone);
  await page.locator('#password').fill(password);
  await submitLoginForm(page);
  await page.waitForURL(/\/seller-onboarding/, { timeout: 30_000 });

  await expect(page.getByRole('heading', { name: SETUP_HEADING })).toBeVisible({ timeout: 15_000 });

  // Step 0: Shop Details
  await page.locator('#name').fill(shopName);
  await page.locator('#contactPhone').fill(contactPhone);
  await page.locator('#contactEmail').fill(`e2e${suffix}@test.local`);
  await page.getByRole('button', { name: /^Next$/i }).click();

  // Step 1: Address
  await page.locator('#address').fill('123 RTC Bus Stand Road');
  await page.locator('#pincode').fill('516001');

  // (c) Map pin: click to place + drag marker
  await page.getByRole('button', { name: /Pin Your Shop Location/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });

  const map = dialog.locator('.leaflet-container');
  await expect(map).toBeVisible({ timeout: 15_000 });

  const addressBlock = dialog.getByText('Selected Location:').locator('..');
  const addressPreview = addressBlock.locator('p').last();

  const box = await map.boundingBox();
  expect(box).toBeTruthy();

  // Seed address via search, then verify click + drag update preview (check c)
  await dialog.getByPlaceholder(/Search for area/i).fill('Nagarajupeta Kadapa');
  await dialog.getByRole('button').nth(1).click();
  await expect(addressBlock).toBeVisible({ timeout: 25_000 });
  const addressAfterSearch = (await addressPreview.textContent())?.trim() ?? '';
  expect(addressAfterSearch.length).toBeGreaterThan(5);

  await map.click({ position: { x: box!.width * 0.35, y: box!.height * 0.5 } });
  await expect
    .poll(async () => (await addressPreview.textContent())?.trim() ?? '', { timeout: 30_000 })
    .not.toBe(addressAfterSearch);

  const addressAfterClick = (await addressPreview.textContent())?.trim() ?? '';

  const marker = dialog.locator('.leaflet-marker-icon').first();
  await expect(marker).toBeVisible({ timeout: 10_000 });
  const markerBox = await marker.boundingBox();
  expect(markerBox).toBeTruthy();
  await page.mouse.move(markerBox!.x + markerBox!.width / 2, markerBox!.y + markerBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(markerBox!.x + markerBox!.width / 2 + 50, markerBox!.y + markerBox!.height / 2 + 40, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(async () => (await addressPreview.textContent())?.trim() ?? '', { timeout: 30_000 })
    .not.toBe(addressAfterClick);

  console.log('CHECK_C_MAP_PIN: pass');

  await dialog.getByRole('button', { name: /Confirm Location/i }).click();
  await expect(page.getByRole('button', { name: /Location Selected/i })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: /^Next$/i }).click();

  // Step 2: Documents — skip optional uploads
  await page.getByRole('button', { name: /^Next$/i }).click();

  // Step 3: Review — submit
  const createShopResponse = page.waitForResponse(
    (r) => r.url().includes('/seller/shop') && r.request().method() === 'POST',
    { timeout: 60_000 },
  );
  await page.getByRole('button', { name: /Submit for Approval/i }).click();
  const createRes = await createShopResponse;
  expect(createRes.ok(), await createRes.text()).toBeTruthy();

  // (a) Pending screen immediately — NOT onboarding form
  await expect(page.getByRole('heading', { name: PENDING_HEADING })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: SETUP_HEADING })).not.toBeVisible();
  await expect(page.getByText(/already have a shop/i)).not.toBeVisible();
  console.log('CHECK_A_PENDING_AFTER_SUBMIT: pass');

  // (b) Reload stays on pending
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: PENDING_HEADING })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: SETUP_HEADING })).not.toBeVisible();
  await expect(page.getByText(/already have a shop/i)).not.toBeVisible();
  console.log('CHECK_B_RELOAD_PENDING: pass');
});
