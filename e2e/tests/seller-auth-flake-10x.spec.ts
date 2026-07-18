/**
 * PR #38 regression — seller dashboard must not latent-redirect to login when
 * accessToken cookie exists but getServerSession() transiently fails.
 * Run 10x: npx playwright test tests/seller-auth-flake-10x.spec.ts --repeat-each=10
 */
import { test } from '../qa-fixtures';
import {
  assertOnRoute,
  assertStyled,
  attachConsoleWatcher,
  clearAuth,
  dumpAuthState,
  enableAuthTrace,
  loginSeller,
  report,
  waitForAuthReady,
} from '../helpers';

const SELLER_ROUTES = [
  '/dashboard',
  '/dashboard/products',
  '/dashboard/orders',
  '/dashboard/offers',
  '/dashboard/ads',
  '/dashboard/earnings',
  '/dashboard/commission',
  '/dashboard/subscription',
  '/dashboard/staff',
  '/dashboard/shop-settings',
];

test('Seller dashboard and sections — no latent login redirect', async ({ page }) => {
  await enableAuthTrace(page);
  const errors = await attachConsoleWatcher(page);
  await clearAuth(page);
  await loginSeller(page);
  await dumpAuthState(page, 'after-login');
  report('Seller login', 'pass');

  for (const route of SELLER_ROUTES) {
    const before = new URL(page.url()).pathname;
    if (!before.startsWith(route)) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
    }
    await waitForAuthReady(page);
    if (new URL(page.url()).pathname.includes('/login')) {
      await dumpAuthState(page, `redirect-at-${route}`);
    }
    assertOnRoute(page, route);
    await assertStyled(page, route);
    report(`Seller ${route}`, 'pass');
  }

  const serious = errors.filter(
    (e) => !/favicon|manifest|ResizeObserver|hydration/i.test(e),
  );
  if (serious.length) {
    report('Seller console errors', 'fail', serious.slice(0, 2).join(' | '));
  }
});
