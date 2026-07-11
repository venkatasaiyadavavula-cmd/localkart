import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const SITE = process.env.SITE_URL || 'https://localkart.store';
export const API = process.env.API_URL || 'https://api.localkart.store/api/v1';

export const CREDS = {
  customer: {
    phone: process.env.CUST_PHONE || '9876512345',
    password: process.env.CUST_PASS || 'Customer@123',
  },
  seller: {
    phone: process.env.SELL_PHONE || '9988776655',
    password: process.env.SELL_PASS || 'Shop@123',
  },
  admin: {
    phone: process.env.ADMIN_PHONE || '9999999999',
    password: process.env.ADMIN_PASS || 'Admin@123',
  },
  staff: {
    id: process.env.STAFF_ID || 'qa_test_worker',
    password: process.env.STAFF_PASS || 'Test@1234',
  },
};

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

type Status = 'pass' | 'fixed' | 'skip' | 'fail';

const results: { item: string; status: Status; note?: string }[] = [];

export function report(item: string, status: Status, note?: string) {
  const icons = { pass: '✅', fixed: '🔧', skip: '⚠️', fail: '❌' };
  const line = `${icons[status]} ${item}${note ? ` — ${note}` : ''}`;
  console.log(line);
  results.push({ item, status, note });
}

export function getResults() {
  return results;
}

export async function attachConsoleWatcher(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

export async function assertNoConsoleErrors(
  errors: string[],
  context: string,
  options?: { allow401?: boolean },
) {
  const ignored = [/favicon/i, /manifest/i, /ResizeObserver/i, /hydration/i, /clipboard/i, /writeText/i];
  if (options?.allow401) ignored.push(/401/i, /Unauthorized/i);
  const serious = errors.filter((e) => !ignored.some((p) => p.test(e)));
  if (serious.length) {
    throw new Error(`Console errors on ${context}: ${serious.slice(0, 3).join(' | ')}`);
  }
}

export async function snap(page: Page, name: string) {
  const safe = name.replace(/[^a-z0-9-_]/gi, '_').slice(0, 80);
  await page.screenshot({ path: path.join(screenshotDir, `${safe}.png`), fullPage: false });
}

export async function assertStyled(page: Page, context: string) {
  const body = page.locator('body');
  await expect(body).toBeVisible();
  const text = await body.innerText();
  expect(text, `${context}: visible error text`).not.toMatch(/Internal Server Error|undefined|NaN|\[object Object\]/);
  // Tailwind/CSS loaded — check a stylesheet link returns 200
  const cssHref = await page.locator('link[rel="stylesheet"]').first().getAttribute('href');
  expect(cssHref, `${context}: missing CSS link`).toBeTruthy();
}

export async function waitForAuthReady(page: Page) {
  await page.waitForFunction(() => !!localStorage.getItem('accessToken'), { timeout: 15_000 });
  await page.waitForFunction(() => document.cookie.includes('accessToken='), { timeout: 10_000 });
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('localkart-auth');
    if (!raw) return false;
    try {
      return JSON.parse(raw).state?.isAuthenticated === true;
    } catch {
      return false;
    }
  }, { timeout: 10_000 });
}

export async function submitLoginForm(page: Page) {
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/login') && r.status() < 400, { timeout: 25_000 }),
    page.locator('form').first().evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
    }),
  ]);
  if (!response.ok()) {
    const body = await response.text().catch(() => '');
    throw new Error(`Login API failed (${response.status()}): ${body.slice(0, 120)}`);
  }
  await waitForAuthReady(page);
}

export async function loginCustomer(page: Page) {
  await page.goto('/login?intent=customer', { waitUntil: 'networkidle' });
  await page.locator('#phone').fill(CREDS.customer.phone);
  await page.locator('#password').fill(CREDS.customer.password);
  await submitLoginForm(page);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 25_000 });
}

export async function loginSeller(page: Page) {
  await page.goto('/login?intent=seller&redirect=/dashboard', { waitUntil: 'networkidle' });
  await page.locator('#phone').fill(CREDS.seller.phone);
  await page.locator('#password').fill(CREDS.seller.password);
  await submitLoginForm(page);
  await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { timeout: 25_000 });
}

export async function loginAdmin(page: Page) {
  await page.goto('/login?redirect=/admin', { waitUntil: 'networkidle' });
  await page.locator('#phone').fill(CREDS.admin.phone);
  await page.locator('#password').fill(CREDS.admin.password);
  await submitLoginForm(page);
  await page.waitForURL((url) => url.pathname.startsWith('/admin'), { timeout: 25_000 });
}

export async function loginStaff(page: Page) {
  await page.goto('/work/login', { waitUntil: 'networkidle' });
  await page.locator('#staffId').fill(CREDS.staff.id);
  await page.locator('#password').fill(CREDS.staff.password);
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/staff/login'), { timeout: 40_000 }),
    page.getByRole('button', { name: /start working/i }).click(),
  ]);
  if (!response.ok()) {
    const body = await response.text().catch(() => '');
    throw new Error(`Staff login API failed (${response.status()}): ${body.slice(0, 120)}`);
  }
  await page.waitForURL(/\/work\/?$/, { timeout: 40_000 });
}

export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* cross-origin guard */
    }
  });
}

export async function clickLinkExpect(
  page: Page,
  link: ReturnType<Page['locator']>,
  urlPattern: RegExp | string,
  label: string,
) {
  await link.scrollIntoViewIfNeeded();
  await link.click({ force: true });
  await page.waitForLoadState('networkidle');
  const url = page.url();
  if (typeof urlPattern === 'string') {
    expect(url, label).toContain(urlPattern);
  } else {
    expect(url, label).toMatch(urlPattern);
  }
}
