/**
 * Seller onboarding login loop — customer without shop can reach onboarding after seller-intent login.
 * Run: SITE_URL=http://localhost:3027 API_URL=http://localhost:3001/api/v1 npx playwright test tests/seller-onboarding-login-loop.spec.ts --project=desktop
 */
import { test, expect } from '../qa-fixtures';
import { API, attachConsoleWatcher, clearAuth, report, submitLoginForm } from '../helpers';

test('customer seller-intent login reaches onboarding (no login loop)', async ({ page }) => {
  const errors = await attachConsoleWatcher(page);
  const phone = `9${String(Date.now()).slice(-9)}`;
  const password = 'TestPass123';

  const reg = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Onboarding Loop Test', phone, password }),
  });
  expect(reg.ok).toBeTruthy();

  await clearAuth(page);
  await page.goto(`/login?intent=seller`, { waitUntil: 'domcontentloaded' });

  await page.locator('#phone').fill(phone);
  await page.locator('#password').fill(password);
  await submitLoginForm(page);

  await page.waitForURL(/\/seller-onboarding/, { timeout: 25_000 });
  expect(page.url()).toContain('/seller-onboarding');
  expect(page.url()).not.toContain('/login');

  await expect(page.getByRole('heading', { name: /Set Up Your Shop/i })).toBeVisible({ timeout: 15_000 });

  const authState = await page.evaluate(() => {
    const raw = localStorage.getItem('localkart-auth');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.state?.user?.role ?? null;
  });
  expect(authState).toBe('customer');

  report('Seller-intent login → onboarding', 'pass');

  const serious = errors.filter((e) => !/favicon|manifest|ResizeObserver|hydration/i.test(e));
  expect(serious).toEqual([]);
});
