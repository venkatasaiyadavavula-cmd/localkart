/**
 * P1 location flow — GPS persistence + manual pincode in dialog.
 */
import { test, expect } from '../qa-fixtures';

test.describe.configure({ timeout: 120_000 });

test.use({ viewport: { width: 390, height: 844 } });

test('GPS detect persists localkart-location and updates Delivering to', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 14.4673, longitude: 78.8242 });

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('localkart-location'));
  await page.reload({ waitUntil: 'networkidle' });

  const setLocBtn = page.getByRole('button', { name: /set location/i }).first();
  await expect(setLocBtn).toBeVisible({ timeout: 15_000 });
  await setLocBtn.click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

  const detect = page.getByRole('button', { name: /detect my location/i });
  await expect(detect).toBeVisible({ timeout: 10_000 });
  await detect.click();

  await expect
    .poll(
      async () => page.evaluate(() => localStorage.getItem('localkart-location')),
      { timeout: 20_000 },
    )
    .toBeTruthy();

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('localkart-location');
    return raw ? JSON.parse(raw) : null;
  });
  expect(stored?.state?.location?.latitude).toBeCloseTo(14.4673, 2);
  expect(stored?.state?.location?.longitude).toBeCloseTo(78.8242, 2);

  const continueBtn = page.getByRole('button', { name: /continue shopping/i });
  if (await continueBtn.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await continueBtn.click();
  }

  await expect
    .poll(async () => {
      const label = await page.locator('button').filter({ hasText: /delivering to/i }).first().innerText();
      return /kadapa|andhra/i.test(label);
    })
    .toBe(true);
});

test('manual pincode entry persists location and updates Delivering to', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.clearPermissions();

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('localkart-location'));
  await page.reload({ waitUntil: 'networkidle' });

  const setLocBtn = page.getByRole('button', { name: /set location/i }).first();
  await expect(setLocBtn).toBeVisible({ timeout: 15_000 });
  await setLocBtn.click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

  const manualLink = page.getByRole('button', { name: /enter pincode manually/i });
  await expect(manualLink).toBeVisible({ timeout: 10_000 });
  await manualLink.click();

  const pinInput = page.locator('input#pincode, input[name="pincode"]');
  await expect(pinInput).toBeVisible();
  await pinInput.fill('516001');

  await page.getByRole('button', { name: /^set location$/i }).click();

  await expect
    .poll(
      async () => page.evaluate(() => localStorage.getItem('localkart-location')),
      { timeout: 25_000 },
    )
    .toBeTruthy();

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('localkart-location');
    return raw ? JSON.parse(raw) : null;
  });
  expect(stored?.state?.location?.pincode).toBe('516001');
  expect(stored?.state?.location?.source).toBe('manual');

  const continueBtn = page.getByRole('button', { name: /continue shopping/i });
  if (await continueBtn.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await continueBtn.click();
  }

  await expect
    .poll(async () => {
      const label = await page.locator('button').filter({ hasText: /delivering to/i }).first().innerText();
      return /kadapa|andhra/i.test(label);
    })
    .toBe(true);
});
