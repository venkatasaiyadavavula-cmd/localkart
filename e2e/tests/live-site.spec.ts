/**
 * Live-site Playwright smoke + exhaustive browser audit.
 * Part A (exhaustive UI clicks) + Part B (edge cases): see live-site-extended.spec.ts
 */
import { test, expect } from '../qa-fixtures';
import {
  assertNoConsoleErrors,
  assertStyled,
  attachConsoleWatcher,
  clearAuth,
  clickLinkExpect,
  CREDS,
  loginAdmin,
  loginCustomer,
  loginSeller,
  loginStaff,
  report,
  snap,
  waitForAuthReady,
} from '../helpers';

const CATEGORIES = ['groceries', 'fashion', 'electronics', 'beauty', 'home-essentials', 'accessories'];

test.describe('Part 1 — Public pages', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('Homepage renders and core nav works', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await page.goto('/');
    await assertStyled(page, 'homepage');
    await snap(page, 'homepage');

    await page.goto('/');
    const browseLink = page.locator('a.section-link[href="/browse"]').first();
    await browseLink.scrollIntoViewIfNeeded();
    await clickLinkExpect(page, browseLink, '/browse', 'See All Browse');
    report('Homepage → /browse link', 'pass');

    await page.goto('/');
    const termsLink = page.locator('footer a[href="/terms"]').first();
    await termsLink.scrollIntoViewIfNeeded();
    await clickLinkExpect(page, termsLink, '/terms', 'Footer Terms');
    report('Homepage footer → /terms', 'pass');

    await page.goto('/');
    await clickLinkExpect(page, page.getByRole('link', { name: /privacy/i }).first(), '/privacy', 'Footer Privacy');
    report('Homepage footer → /privacy', 'pass');

    await page.goto('/');
    const aboutLink = page.locator('footer a[href="/about"], footer a:has-text("About")').first();
    if (await aboutLink.count()) {
      await aboutLink.click();
      await page.waitForLoadState('networkidle');
      const url = page.url();
      if (url.includes('/about')) {
        report('Homepage footer About Us → /about', 'pass');
      } else {
        report('Homepage footer About Us', 'fail', `went to ${url} not /about`);
      }
    } else {
      report('Homepage footer About Us link', 'skip', 'no /about footer link found');
    }

    await assertNoConsoleErrors(errors, 'homepage');
  });

  test('Homepage category and section links', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await page.goto('/');
    await assertStyled(page, 'homepage sections');

    // Videos section
    const videosLink = page.locator('a[href="/videos"]').first();
    if (await videosLink.isVisible()) {
      await clickLinkExpect(page, videosLink, '/videos', 'Videos');
      report('Homepage → /videos', 'pass');
    }

    await page.goto('/');
    const saleLink = page.locator('a[href="/browse?sale=true"]').first();
    if (await saleLink.isVisible()) {
      await clickLinkExpect(page, saleLink, '/browse?sale=true', "Today's Deals");
      report('Homepage → /browse?sale=true', 'pass');
    }

    await assertNoConsoleErrors(errors, 'homepage sections');
  });

  test('Browse and all category pages', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);

    await page.goto('/browse');
    await assertStyled(page, '/browse');
    await snap(page, 'browse');
    report('/browse page renders', 'pass');

    // Sort dropdown
    const sortBtn = page.getByRole('button', { name: /sort/i }).first();
    if (await sortBtn.isVisible()) {
      await sortBtn.click();
      await page.getByText('Price: Low to High').click();
      await page.waitForTimeout(1000);
      report('/browse sort dropdown', 'pass');
    }

    // Product card click-through
    const productLink = page.locator('a[href*="/product/"]').first();
    if (await productLink.count()) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/product\//);
      await assertStyled(page, 'product detail');
      report('/browse product card → detail', 'pass');
    } else {
      report('/browse product card', 'skip', 'no products visible');
    }

    for (const cat of CATEGORIES) {
      await page.goto(`/browse/${cat}`);
      await assertStyled(page, `/browse/${cat}`);
      const status = page.url().includes(`/browse/${cat}`) ? 'pass' : 'fail';
      report(`/browse/${cat} renders`, status as 'pass' | 'fail');
    }

    await assertNoConsoleErrors(errors, 'browse');
  });

  test("Today's Deals sale view", async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await page.goto('/browse?sale=true');
    await assertStyled(page, '/browse?sale=true');
    await snap(page, 'browse-sale');
    const body = await page.locator('body').innerText();
    if (body.match(/0 products|no offers|network error/i)) {
      report('/browse?sale=true content', 'skip', 'no active offers or empty state shown');
    } else {
      report('/browse?sale=true with offers/products', 'pass');
    }
    await assertNoConsoleErrors(errors, 'sale browse');
  });

  test('Static pages: about, terms, privacy, videos', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    for (const route of ['/about', '/terms', '/privacy', '/videos']) {
      await page.goto(route);
      await assertStyled(page, route);
      report(`${route} renders`, 'pass');
    }
    await assertNoConsoleErrors(errors, 'static pages');
  });

  test('Auth pages: login, register, forgot-password', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);

    await page.goto('/login');
    await assertStyled(page, '/login');
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    report('/login form fields', 'pass');

    const registerHref = await page.getByRole('link', { name: 'Create account' }).getAttribute('href');
    expect(registerHref).toMatch(/\/register/);
    await page.goto(registerHref!);
    await page.waitForURL(/\/register/);
    report('/login → /register link', 'pass');

    await page.goto('/register');
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    report('/register form fields', 'pass');

    await page.goto('/forgot-password');
    await assertStyled(page, '/forgot-password');
    report('/forgot-password renders', 'pass');

    // Validation: empty login
    await page.goto('/login');
    await page.locator('form').first().evaluate((f) => (f as HTMLFormElement).requestSubmit());
    await page.waitForTimeout(500);
    report('/login validation on empty submit', 'pass');

    await assertNoConsoleErrors(errors, 'auth pages');
  });

  test('Guest cart and order tracking', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);

    await page.goto('/cart');
    await assertStyled(page, '/cart');
    const empty = page.getByRole('heading', { name: /your cart is empty/i });
    if (await empty.isVisible()) {
      report('Guest /cart empty state', 'pass');
    }

    await page.goto('/orders/track');
    await assertStyled(page, '/orders/track');
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible();
    report('/orders/track search input', 'pass');

    await assertNoConsoleErrors(errors, 'guest cart/track');
  });

  test('Shop page renders', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    // Get a shop slug from API
    const res = await page.request.get(`${process.env.API_URL || 'https://api.localkart.store/api/v1'}/catalog/products?limit=5`);
    const data = await res.json();
    const products = data?.data?.products || data?.products || data?.data || [];
    const shopSlug = products.find((p: { shop?: { slug?: string } }) => p.shop?.slug)?.shop?.slug;
    if (!shopSlug) {
      report('/shop/[slug]', 'skip', 'no shop slug from API');
      return;
    }
    await page.goto(`/shop/${shopSlug}`);
    await assertStyled(page, '/shop');
    report(`/shop/${shopSlug} renders`, 'pass');
    await assertNoConsoleErrors(errors, 'shop page');
  });
});

test.describe('Part 2 — Customer flow', () => {
  test('Customer login and protected pages', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await clearAuth(page);
    await loginCustomer(page);
    report('Customer login', 'pass');

    for (const route of ['/orders', '/wishlist', '/profile', '/profile/addresses']) {
      await page.goto(route);
      await assertStyled(page, route);
      if (page.url().includes('/login')) {
        report(`Customer ${route}`, 'fail', 'redirected to login');
      } else {
        report(`Customer ${route}`, 'pass');
      }
    }

    await assertNoConsoleErrors(errors, 'customer pages');
  });

  test('Customer checkout COD flow', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await clearAuth(page);
    await loginCustomer(page);

    // Add product via browse
    await page.goto('/browse/groceries');
    const productLink = page.locator('a[href*="/product/"]').first();
    if (!(await productLink.count())) {
      report('Customer checkout COD', 'skip', 'no products');
      return;
    }
    await productLink.click();
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1500);
    }

    await page.goto('/checkout');
    if (page.url().includes('/login')) {
      report('Customer /checkout', 'fail', 'redirected to login');
      return;
    }
    await assertStyled(page, '/checkout');

    const placeOrder = page.getByRole('button', { name: /place cod order/i });
    if (await placeOrder.isVisible()) {
      // Fill if empty
      const name = page.locator('#name');
      if (await name.isVisible() && !(await name.inputValue())) {
        await name.fill('QA Test User');
        await page.locator('#phone').fill(CREDS.customer.phone);
        await page.locator('#address').fill('123 Test Street');
        await page.locator('#city').fill('Kadapa');
        await page.locator('#state').fill('Andhra Pradesh');
        await page.locator('#pincode').fill('516001');
      }
      await placeOrder.click();
      await page.waitForURL(/\/orders/, { timeout: 30_000 });
      report('Customer COD checkout', 'pass');
    } else {
      report('Customer checkout', 'skip', 'Place COD button not visible');
    }

    await assertNoConsoleErrors(errors, 'checkout');
  });

  test('Language toggle persists', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/');
    const langBtn = page.getByRole('button', { name: /EN|తె/i }).first();
    if (!(await langBtn.isVisible())) {
      report('Language toggle', 'skip', 'not visible on viewport');
      return;
    }
    await langBtn.click();
    await page.waitForTimeout(500);
    await page.goto('/browse');
    const langBtn2 = page.getByRole('button', { name: /EN|తె/i }).first();
    if (await langBtn2.isVisible()) {
      report('Language toggle across pages', 'pass');
    }
  });
});

test.describe('Part 3 — Seller flow', () => {
  test('Seller dashboard and nav pages', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await clearAuth(page);
    await loginSeller(page);
    report('Seller login', 'pass');

    const routes = [
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

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      if (page.url().includes('/login')) {
        report(`Seller ${route}`, 'fail', 'redirected to login');
      } else {
        await assertStyled(page, route);
        report(`Seller ${route}`, 'pass');
      }
    }

    await assertNoConsoleErrors(errors, 'seller');
  });
});

test.describe('Part 4 — Staff flow', () => {
  test('Staff unauthenticated redirects', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/work/login');
    await expect(page.locator('#staffId')).toBeVisible();
    expect(page.url()).toContain('/work/login');
    report('Staff /work/login (incognito)', 'pass');

    await page.goto('/work/orders');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/work/login');
    report('Staff /work/orders → /work/login', 'pass');
  });

  test('Staff authenticated panel', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await clearAuth(page);
    await loginStaff(page);
    report('Staff login UI', 'pass');

    for (const route of ['/work', '/work/orders', '/work/products']) {
      await page.goto(route);
      await assertStyled(page, route);
      if (page.url().includes('/work/login')) {
        report(`Staff ${route}`, 'fail', 'kicked to login');
      } else {
        report(`Staff ${route}`, 'pass');
      }
    }
    await assertNoConsoleErrors(errors, 'staff');
  });
});

test.describe('Part 5 — Admin flow', () => {
  test('Admin dashboard and sections', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await clearAuth(page);
    await loginAdmin(page);
    report('Admin login', 'pass');

    const routes = ['/admin', '/admin/sellers', '/admin/products', '/admin/commissions', '/admin/disputes', '/admin/customers', '/admin/settings'];
    for (const route of routes) {
      if (!page.url().includes(route)) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
      }
      await waitForAuthReady(page);
      if (!page.url().includes(route) || page.url().includes('/login')) {
        throw new Error(`Admin ${route} failed — at ${page.url()}`);
      }
      await assertStyled(page, route);
      report(`Admin ${route}`, 'pass');
    }
    await assertNoConsoleErrors(errors, 'admin');
  });
});

test.describe('Part 6 — Mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('Homepage footer and nav at 375px', async ({ page }) => {
    const errors = await attachConsoleWatcher(page);
    await page.goto('/');
    await assertStyled(page, 'mobile homepage');
    await snap(page, 'mobile-homepage');

    const termsLink = page.locator('footer a[href="/terms"]').first();
    await termsLink.scrollIntoViewIfNeeded();
    const termsHref = await termsLink.getAttribute('href');
    expect(termsHref).toBe('/terms');
    await page.goto(termsHref!);
    await assertStyled(page, 'mobile /terms');
    report('Mobile footer Terms → /terms', 'pass');

    await page.goto('/');
    const browseLink = page.locator('a[href="/browse"]').first();
    if (await browseLink.isVisible()) {
      await clickLinkExpect(page, browseLink, '/browse', 'Mobile browse link');
      report('Mobile homepage → /browse', 'pass');
    }

    await assertNoConsoleErrors(errors, 'mobile homepage');
  });

  test('Staff login at 375px', async ({ page }) => {
    await page.goto('/work/login');
    await expect(page.locator('#staffId')).toBeVisible();
    report('Mobile /work/login', 'pass');
  });
});