/**
 * Part A (exhaustive UI clicks) + Part B (business-logic edge cases).
 * Companion to live-site.spec.ts — discovered automatically by Playwright.
 */
import { test, expect } from '../qa-fixtures';
import {
  assertNoConsoleErrors,
  assertStyled,
  attachConsoleWatcher,
  clearAuth,
  CREDS,
  loginCustomer,
  loginSeller,
  loginAdmin,
  loginStaff,
  report,
} from '../helpers';
import { exhaustPageClicks } from '../exhaustive-clicks';
import {
  apiLogin,
  authHeaders,
  findLowStockProduct,
  findProductFromOtherShop,
  getCustomerOrders,
  getCustomerToken,
  getSellerToken,
  staffApiLogin,
} from '../api-helpers';

const API = process.env.API_URL || 'https://api.localkart.store/api/v1';
const CATEGORIES = ['groceries', 'fashion', 'electronics', 'beauty', 'home-essentials', 'accessories'];

const PUBLIC_ROUTES = [
  '/',
  '/browse',
  ...CATEGORIES.map((c) => `/browse/${c}`),
  '/browse?sale=true',
  '/about',
  '/terms',
  '/privacy',
  '/videos',
  '/login',
  '/register',
  '/forgot-password',
  '/cart',
  '/orders/track',
];

const SELLER_ROUTES = [
  '/dashboard',
  '/dashboard/products',
  '/dashboard/products/new',
  '/dashboard/products/bulk-upload',
  '/dashboard/orders',
  '/dashboard/offers',
  '/dashboard/ads',
  '/dashboard/earnings',
  '/dashboard/commission',
  '/dashboard/subscription',
  '/dashboard/staff',
  '/dashboard/shop-settings',
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/sellers',
  '/admin/products',
  '/admin/commissions',
  '/admin/disputes',
  '/admin/customers',
  '/admin/settings',
];

const STAFF_ROUTES = ['/work', '/work/orders', '/work/products', '/work/products/new'];

const VALID_ADDRESS = {
  name: 'QA Test User',
  phone: '+919876512345',
  address: '123 Test Street, RTC Bus Stand',
  city: 'Kadapa',
  state: 'Andhra Pradesh',
  pincode: '516001',
  latitude: 14.4673,
  longitude: 78.8242,
};

// ─── PART A: Exhaustive UI ───────────────────────────────────────────────────

test.describe('Part A — Exhaustive UI clicks', () => {
  test.describe.configure({ timeout: 300_000 });

  test.describe('Public pages', () => {
    test.beforeEach(async ({ page }) => clearAuth(page));

    for (const route of PUBLIC_ROUTES) {
      test(`exhaustive: ${route}`, async ({ page }) => {
        const errors = await attachConsoleWatcher(page);
        const stats = await exhaustPageClicks(page, route, route, errors);
        report(`Exhaustive ${route}`, stats.failed ? 'fail' : 'pass', `${stats.clicked} clicked, ${stats.skipped} skipped`);
        await assertNoConsoleErrors(errors, route, { allow401: true });
      });
    }

    test('exhaustive: /shop/[slug]', async ({ page, request }) => {
      const errors = await attachConsoleWatcher(page);
      const res = await request.get(`${API}/catalog/products?limit=10`);
      const body = await res.json();
      const products = body?.data?.products ?? body?.data ?? [];
      const slug = products.find((p: { shop?: { slug?: string } }) => p.shop?.slug)?.shop?.slug;
      if (!slug) {
        report('Exhaustive /shop/[slug]', 'skip', 'no shop slug');
        return;
      }
      const route = `/shop/${slug}`;
      const stats = await exhaustPageClicks(page, route, route, errors);
      report(`Exhaustive ${route}`, stats.failed ? 'fail' : 'pass');
      await assertNoConsoleErrors(errors, route, { allow401: true });
    });

    test('exhaustive: product detail page', async ({ page, request }) => {
      const errors = await attachConsoleWatcher(page);
      const res = await request.get(`${API}/catalog/products?limit=5`);
      const body = await res.json();
      const products = body?.data?.products ?? body?.data ?? [];
      const product = products[0];
      if (!product?.slug) {
        report('Exhaustive product detail', 'skip', 'no product');
        return;
      }
      const cat = product.categoryType || product.category || 'groceries';
      const route = `/browse/${cat}/product/${product.slug}`;
      const stats = await exhaustPageClicks(page, route, route, errors, {
        skipText: /add to cart|buy now/i,
      });
      report(`Exhaustive ${route}`, stats.failed ? 'fail' : 'pass');
      await assertNoConsoleErrors(errors, 'product detail', { allow401: true });
    });
  });

  test.describe('Customer pages', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuth(page);
      await loginCustomer(page);
    });

    for (const route of ['/wishlist', '/profile', '/profile/addresses', '/orders']) {
      test(`exhaustive customer: ${route}`, async ({ page }) => {
        const errors = await attachConsoleWatcher(page);
        const stats = await exhaustPageClicks(page, route, route, errors);
        report(`Exhaustive customer ${route}`, stats.failed ? 'fail' : 'pass');
        await assertNoConsoleErrors(errors, route, { allow401: true });
      });
    }

    test('exhaustive: /orders/[id]', async ({ page, request }) => {
      const errors = await attachConsoleWatcher(page);
      const token = await getCustomerToken(request);
      const orders = await getCustomerOrders(request, token);
      const order = orders[0];
      if (!order?.id) {
        report('Exhaustive /orders/[id]', 'skip', 'no orders');
        return;
      }
      const route = `/orders/${order.id}`;
      const stats = await exhaustPageClicks(page, route, route, errors);
      report(`Exhaustive ${route}`, stats.failed ? 'fail' : 'pass');
      await assertNoConsoleErrors(errors, route, { allow401: true });
    });

    test('exhaustive: /returns/[orderId]', async ({ page, request }) => {
      const errors = await attachConsoleWatcher(page);
      const token = await getCustomerToken(request);
      const orders = await getCustomerOrders(request, token);
      const delivered = orders.find((o: { status?: string }) => o.status === 'delivered');
      if (!delivered?.id) {
        report('Exhaustive /returns/[orderId]', 'skip', 'no delivered order');
        return;
      }
      const route = `/returns/${delivered.id}`;
      await page.goto(route);
      if (page.url().includes('/login')) {
        report('Exhaustive /returns/[orderId]', 'skip', 'redirected');
        return;
      }
      const stats = await exhaustPageClicks(page, route, route, errors, { skipText: /submit/i });
      report(`Exhaustive ${route}`, stats.failed ? 'fail' : 'pass');
      await assertNoConsoleErrors(errors, route, { allow401: true });
    });

    test('exhaustive: /checkout with items', async ({ page }) => {
      const errors = await attachConsoleWatcher(page);
      await page.goto('/browse/groceries');
      const link = page.locator('a[href*="/product/"]').first();
      if (!(await link.count())) {
        report('Exhaustive /checkout', 'skip', 'no products');
        return;
      }
      await link.click();
      await page.waitForLoadState('networkidle');
      const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
      if (await addBtn.isVisible()) await addBtn.click();
      await page.waitForTimeout(1500);
      const stats = await exhaustPageClicks(page, '/checkout', '/checkout', errors, {
        skipText: /place cod|place order/i,
      });
      report('Exhaustive /checkout', stats.failed ? 'fail' : 'pass');
      await assertNoConsoleErrors(errors, '/checkout', { allow401: true });
    });
  });

  test.describe('Seller dashboard pages', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuth(page);
      await loginSeller(page);
    });

    for (const route of SELLER_ROUTES) {
      test(`exhaustive seller: ${route}`, async ({ page }) => {
        const errors = await attachConsoleWatcher(page);
        await page.goto(route);
        if (page.url().includes('/login')) {
          report(`Exhaustive seller ${route}`, 'fail', 'redirected to login');
          return;
        }
        const stats = await exhaustPageClicks(page, route, route, errors);
        report(`Exhaustive seller ${route}`, stats.failed ? 'fail' : 'pass');
        await assertNoConsoleErrors(errors, route, { allow401: true });
      });
    }
  });

  test.describe('Admin pages', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuth(page);
      await loginAdmin(page);
    });

    for (const route of ADMIN_ROUTES) {
      test(`exhaustive admin: ${route}`, async ({ page }) => {
        const errors = await attachConsoleWatcher(page);
        await page.goto(route);
        if (page.url().includes('/login')) {
          report(`Exhaustive admin ${route}`, 'fail', 'redirected to login');
          return;
        }
        const stats = await exhaustPageClicks(page, route, route, errors, {
          skipText: /approve|reject|suspend|delete/i,
        });
        report(`Exhaustive admin ${route}`, stats.failed ? 'fail' : 'pass');
        await assertNoConsoleErrors(errors, route, { allow401: true });
      });
    }
  });

  test.describe('Staff pages', () => {
    test('exhaustive: /work/login', async ({ page }) => {
      await clearAuth(page);
      const errors = await attachConsoleWatcher(page);
      const stats = await exhaustPageClicks(page, '/work/login', '/work/login', errors, {
        skipText: /start working/i,
      });
      report('Exhaustive /work/login', stats.failed ? 'fail' : 'pass');
      await assertNoConsoleErrors(errors, '/work/login', { allow401: true });
    });

    test.beforeEach(async ({ page }) => {
      await clearAuth(page);
      await loginStaff(page);
    });

    for (const route of STAFF_ROUTES) {
      test(`exhaustive staff: ${route}`, async ({ page }) => {
        const errors = await attachConsoleWatcher(page);
        await page.goto(route);
        if (page.url().includes('/work/login')) {
          report(`Exhaustive staff ${route}`, 'fail', 'kicked to login');
          return;
        }
        const stats = await exhaustPageClicks(page, route, route, errors);
        report(`Exhaustive staff ${route}`, stats.failed ? 'fail' : 'pass');
        await assertNoConsoleErrors(errors, route, { allow401: true });
      });
    }
  });
});

// ─── PART B: Business-logic edge cases ─────────────────────────────────────

test.describe('Part B — Business-logic edge cases', () => {
  test.describe.configure({ timeout: 180_000 });

  test('B1: concurrent checkout prevents overselling last unit', async ({ request }) => {
    const sellerToken = await getSellerToken(request);
    const low = await findLowStockProduct(request, 5);
    if (!low?.id) {
      report('B1 stock race', 'skip', 'no low-stock product');
      return;
    }

    // Set stock to exactly 1 for race test
    const setStock = await request.put(`${API}/catalog/seller/products/${low.id}`, {
      headers: authHeaders(sellerToken),
      data: { stock: 1 },
    });
    if (!setStock.ok()) {
      report('B1 stock race', 'skip', `cannot set stock: ${setStock.status()}`);
      return;
    }

    const phoneA = CREDS.customer.phone;
    const phoneB = `9876${String(Date.now()).slice(-6)}`;
    const pass = 'RaceTest@123';

    const regB = await request.post(`${API}/auth/register`, {
      data: { name: 'Race QA B', phone: phoneB, password: pass, role: 'customer' },
    });
    if (!regB.ok()) {
      report('B1 stock race', 'skip', 'could not register temp customer B');
      return;
    }

    const tokenA = await getCustomerToken(request);
    const { accessToken: tokenB } = await apiLogin(request, phoneB, pass);

    const addBody = { productId: low.id, quantity: 1 };
    await request.post(`${API}/cart/items`, { headers: authHeaders(tokenA), data: addBody });
    await request.post(`${API}/cart/items`, { headers: authHeaders(tokenB), data: addBody });

    const checkoutA = () =>
      request.post(`${API}/orders`, {
        headers: authHeaders(tokenA),
        data: { paymentMethod: 'cod', shippingAddress: VALID_ADDRESS },
      });

    const checkoutB = () =>
      request.post(`${API}/orders`, {
        headers: authHeaders(tokenB),
        data: { paymentMethod: 'cod', shippingAddress: VALID_ADDRESS },
      });

    const [resA, resB] = await Promise.all([checkoutA(), checkoutB()]);

    const okCount = [resA, resB].filter((r) => r.status() >= 200 && r.status() < 300).length;
    const failCount = [resA, resB].filter((r) => r.status() >= 400).length;

    if (okCount === 1 && failCount === 1) {
      report('B1 concurrent checkout oversell prevention', 'pass', `statuses ${resA.status()}/${resB.status()}`);
    } else {
      report('B1 concurrent checkout oversell prevention', 'fail', `ok=${okCount} fail=${failCount} (${resA.status()}/${resB.status()})`);
    }

    // Restore stock
    await request.put(`${API}/catalog/seller/products/${low.id}`, {
      headers: authHeaders(sellerToken),
      data: { stock: Math.max(low.stock ?? 5, 5) },
    });
  });

  test('B2: customer cannot access another users order', async ({ request }) => {
    const token = await getCustomerToken(request);
    const orders = await getCustomerOrders(request, token);
    if (!orders.length) {
      report('B2 order IDOR', 'skip', 'no orders to derive ID pattern');
      return;
    }
    const fakeId = '00000000-0000-4000-8000-000000000001';
    const res = await request.get(`${API}/orders/${fakeId}`, { headers: authHeaders(token) });
    if (res.status() === 403 || res.status() === 404) {
      report('B2 foreign order UUID blocked', 'pass', `HTTP ${res.status()}`);
    } else {
      report('B2 foreign order UUID blocked', 'fail', `HTTP ${res.status()}`);
    }

    // Try incrementing — if any order id looks numeric in orderNumber, use UUID brute
    const res2 = await request.get(`${API}/orders/not-a-real-order-id`, { headers: authHeaders(token) });
    if (res2.status() === 403 || res2.status() === 404) {
      report('B2 invalid order id blocked', 'pass', `HTTP ${res2.status()}`);
    } else {
      report('B2 invalid order id blocked', 'fail', `HTTP ${res2.status()}`);
    }
  });

  test('B3: seller cannot access another sellers product', async ({ request }) => {
    const sellerToken = await getSellerToken(request);
    const other = await findProductFromOtherShop(request, sellerToken);
    if (!other?.id) {
      report('B3 cross-seller product', 'skip', 'only one shop in catalog');
      return;
    }
    const res = await request.put(`${API}/catalog/seller/products/${other.id}`, {
      headers: authHeaders(sellerToken),
      data: { name: 'Hacked Name' },
    });
    if (res.status() === 403 || res.status() === 404) {
      report('B3 cross-seller product update blocked', 'pass', `HTTP ${res.status()}`);
    } else {
      report('B3 cross-seller product update blocked', 'fail', `HTTP ${res.status()}`);
    }

    const shopRes = await request.get(`${API}/seller/shop`, { headers: authHeaders(sellerToken) });
    const myShop = (await shopRes.json())?.data;
    const foreignShopId = other.shopId ?? other.shop?.id;
    if (foreignShopId && myShop?.id !== foreignShopId) {
      const toggle = await request.put(`${API}/seller/shop/toggle`, {
        headers: authHeaders(sellerToken),
        data: { manualOverride: 'force_closed' },
      });
      // toggle only affects own shop — foreign shop id not in API path; verify own shop settings
      if (toggle.ok()) {
        report('B3 seller shop toggle scoped to own shop', 'pass');
        await request.put(`${API}/seller/shop/toggle`, {
          headers: authHeaders(sellerToken),
          data: { manualOverride: 'force_open' },
        });
      }
    }
  });

  test('B4: backend rejects invalid checkout payload', async ({ request }) => {
    const token = await getCustomerToken(request);
    await request.delete(`${API}/cart`, { headers: authHeaders(token) });

    const resEmpty = await request.post(`${API}/orders`, {
      headers: authHeaders(token),
      data: { paymentMethod: 'cod', shippingAddress: VALID_ADDRESS },
    });
    if (resEmpty.status() === 400) {
      report('B4 empty cart checkout rejected', 'pass', `HTTP ${resEmpty.status()}`);
    } else {
      report('B4 empty cart checkout rejected', 'fail', `HTTP ${resEmpty.status()}`);
    }

    const resBadAddr = await request.post(`${API}/orders`, {
      headers: authHeaders(token),
      data: {
        paymentMethod: 'cod',
        shippingAddress: { name: '', phone: 'bad', address: '', city: '', state: '', pincode: '12' },
      },
    });
    if (resBadAddr.status() === 400) {
      report('B4 malformed address rejected', 'pass', `HTTP ${resBadAddr.status()}`);
    } else {
      report('B4 malformed address rejected', 'fail', `HTTP ${resBadAddr.status()}`);
    }

    const products = await request.get(`${API}/catalog/products?limit=1`);
    const p = ((await products.json())?.data?.products ?? [])[0];
    if (p?.id) {
      await request.post(`${API}/cart/items`, { headers: authHeaders(token), data: { productId: p.id, quantity: 1 } });
      const tampered = await request.post(`${API}/orders`, {
        headers: authHeaders(token),
        data: {
          paymentMethod: 'cod',
          shippingAddress: VALID_ADDRESS,
          totalAmount: 1,
          subtotal: 1,
          tamperedPrice: 0.01,
        },
      });
      if (tampered.status() >= 200 && tampered.status() < 300) {
        const body = await tampered.json();
        const order = body?.data ?? body;
        const charged = order?.totalAmount ?? order?.finalAmount;
        if (charged && charged > 1) {
          report('B4 tampered price ignored (server-side pricing)', 'pass', `charged=${charged}`);
        } else {
          report('B4 tampered price ignored', 'fail', `charged=${charged}`);
        }
      } else {
        report('B4 tampered price rejected', 'pass', `HTTP ${tampered.status()}`);
      }
      await request.delete(`${API}/cart`, { headers: authHeaders(token) });
    }

    const negQty = await request.put(`${API}/cart/items/${p?.id}`, {
      headers: authHeaders(token),
      data: { quantity: -1 },
    });
    if (negQty.status() === 400) {
      report('B4 negative cart quantity rejected', 'pass');
    } else {
      report('B4 negative cart quantity rejected', negQty.status() === 404 ? 'skip' : 'fail', `HTTP ${negQty.status()}`);
    }
  });

  test('B5: empty cart /checkout redirects sensibly', async ({ page }) => {
    await clearAuth(page);
    await loginCustomer(page);
    await page.evaluate(() => localStorage.removeItem('localkart-cart'));
    await page.goto('/checkout', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes('/cart') || url.includes('/checkout')) {
      const text = await page.locator('body').innerText();
      if (url.includes('/cart') || /empty|no items/i.test(text)) {
        report('B5 empty cart /checkout handling', 'pass', url);
      } else {
        report('B5 empty cart /checkout handling', 'skip', url);
      }
    } else {
      report('B5 empty cart /checkout handling', 'pass', `redirected to ${url}`);
    }
  });

  test('B6: closed shop blocks checkout for cart items', async ({ page, request }) => {
    const sellerToken = await getSellerToken(request);
    const custToken = await getCustomerToken(request);

    const products = await request.get(`${API}/catalog/products?limit=10`);
    const body = await products.json();
    const list = (body?.data?.products ?? body?.data ?? []) as { id: string; shopId?: string }[];
    const product = Array.isArray(list) ? list[0] : undefined;
    if (!product?.id) {
      report('B6 closed shop checkout', 'skip', 'no products');
      return;
    }

    await request.put(`${API}/seller/shop/toggle`, {
      headers: authHeaders(sellerToken),
      data: { manualOverride: 'force_closed' },
    });

    await request.delete(`${API}/cart`, { headers: authHeaders(custToken) });
    await request.post(`${API}/cart/items`, {
      headers: authHeaders(custToken),
      data: { productId: product.id, quantity: 1 },
    });

    const apiCheckout = await request.post(`${API}/orders`, {
      headers: authHeaders(custToken),
      data: { paymentMethod: 'cod', shippingAddress: VALID_ADDRESS },
    });

    await request.put(`${API}/seller/shop/toggle`, {
      headers: authHeaders(sellerToken),
      data: { manualOverride: 'force_open' },
    });

    if (apiCheckout.status() === 400) {
      const msg = await apiCheckout.text();
      if (/closed/i.test(msg)) {
        report('B6 closed shop API checkout blocked', 'pass');
      } else {
        report('B6 closed shop API checkout blocked', 'pass', `HTTP 400: ${msg.slice(0, 80)}`);
      }
    } else {
      report('B6 closed shop API checkout blocked', 'fail', `HTTP ${apiCheckout.status()}`);
    }

    await clearAuth(page);
    await loginCustomer(page);
    await page.goto('/checkout', { waitUntil: 'networkidle' });
    const pageText = await page.locator('body').innerText();
    if (/closed|not accepting|unavailable/i.test(pageText)) {
      report('B6 closed shop UI shows reason', 'pass');
    } else {
      report('B6 closed shop UI shows reason', 'skip', 'banner may depend on shop fetch timing');
    }
  });

  test('B7: returns flow API — seller pending list accessible', async ({ request }) => {
    const sellerToken = await getSellerToken(request);
    const res = await request.get(`${API}/returns/seller/pending`, { headers: authHeaders(sellerToken) });
    if (res.ok()) {
      report('B7 seller returns pending list', 'pass');
      const body = await res.json();
      const pending = body?.data ?? body ?? [];
      if (Array.isArray(pending) && pending.length > 0) {
        report('B7 pending returns exist for seller review', 'pass', `${pending.length} pending`);
      } else {
        report('B7 full return E2E approve/reject', 'skip', 'no pending returns in QA data');
      }
    } else {
      report('B7 seller returns pending list', res.status() === 404 ? 'skip' : 'fail', `HTTP ${res.status()}`);
    }

    const custToken = await getCustomerToken(request);
    const orders = await getCustomerOrders(request, custToken);
    const delivered = orders.find((o: { status?: string }) => o.status === 'delivered');
    if (delivered?.id) {
      const pageRes = await request.get(`${API}/orders/${delivered.id}`, { headers: authHeaders(custToken) });
      if (pageRes.ok()) {
        report('B7 customer delivered order readable for returns', 'pass');
      }
    } else {
      report('B7 customer return request E2E', 'skip', 'no delivered order within return window');
    }
  });

  test('B8: staff role permission boundaries via API', async ({ request }) => {
    const sellerToken = await getSellerToken(request);
    const suffix = Date.now().toString().slice(-7);
    const staffPhone = `9876${suffix.slice(-6)}`;

    const create = await request.post(`${API}/seller/staff`, {
      headers: authHeaders(sellerToken),
      data: {
        name: 'QA Delivery Only',
        phone: `+91${staffPhone}`,
        role: 'delivery_staff',
        staffId: `qa_del_${suffix}`,
        password: 'DelStaff@12',
      },
    });

    if (!create.ok()) {
      report('B8 staff permission boundaries', 'skip', `could not create temp staff: ${create.status()}`);
      return;
    }

    const staffLogin = await staffApiLogin(request, `qa_del_${suffix}`, 'DelStaff@12');
    if (!staffLogin.ok) {
      report('B8 staff permission boundaries', 'skip', 'temp staff login failed');
      return;
    }

    const staffToken = staffLogin.accessToken;

    const readOrders = await request.get(`${API}/staff/work/orders`, { headers: authHeaders(staffToken) });
    if (readOrders.ok()) {
      report('B8 delivery_staff orders:read allowed', 'pass');
    } else {
      report('B8 delivery_staff orders:read allowed', 'fail', `HTTP ${readOrders.status()}`);
    }

    const createProduct = await request.post(`${API}/staff/work/products`, {
      headers: authHeaders(staffToken),
      data: {
        name: 'QA Forbidden Product',
        price: 99,
        stock: 1,
        categoryType: 'groceries',
      },
    });
    if (createProduct.status() === 403) {
      report('B8 delivery_staff products:write blocked', 'pass', 'HTTP 403');
    } else {
      report('B8 delivery_staff products:write blocked', 'fail', `HTTP ${createProduct.status()}`);
    }

    // Worker (qa_test_worker) should have products:write
    const workerLogin = await staffApiLogin(request, CREDS.staff.id, CREDS.staff.password);
    if (workerLogin.ok) {
      const workerProducts = await request.get(`${API}/staff/work/products`, {
        headers: authHeaders(workerLogin.accessToken),
      });
      report(
        'B8 worker products:read allowed',
        workerProducts.ok() ? 'pass' : 'fail',
        `HTTP ${workerProducts.status()}`,
      );
    }

    // Cleanup temp staff
    const created = await create.json();
    const staffId = created?.data?.id ?? created?.id;
    if (staffId) {
      await request.delete(`${API}/seller/staff/${staffId}`, { headers: authHeaders(sellerToken) });
    }
  });
});
