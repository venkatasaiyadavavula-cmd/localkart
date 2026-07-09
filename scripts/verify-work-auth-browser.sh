#!/usr/bin/env bash
# Browser-level check: /work/login must not redirect to customer login.
set -euo pipefail

SITE="${SITE_URL:-https://localkart.store}"
STAFF_ID="${STAFF_ID:-qa_test_worker}"
STAFF_PASS="${STAFF_PASS:-Test@1234}"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

cat > "$TMPDIR/work-auth.spec.mjs" <<'EOF'
import { chromium } from 'playwright';

const site = process.env.SITE_URL || 'https://localkart.store';
const staffId = process.env.STAFF_ID || 'qa_test_worker';
const staffPass = process.env.STAFF_PASS || 'Test@1234';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  // 1) Incognito-style: no cookies/storage — /work/login must stay on staff form
  await page.goto(`${site}/work/login`, { waitUntil: 'networkidle', timeout: 30000 });
  const url1 = page.url();
  if (!url1.includes('/work/login')) {
    throw new Error(`Expected /work/login, got ${url1}`);
  }
  await page.waitForSelector('#staffId', { timeout: 10000 });
  await page.waitForSelector('text=Start Working', { timeout: 10000 });
  const hasPhone = await page.locator('#phone').count();
  if (hasPhone > 0) {
    throw new Error('Customer phone input found on /work/login — redirected to wrong login');
  }
  console.log('OK: /work/login renders staff form without redirect');

  // 2) Protected route without login → must redirect to /work/login (not /login)
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${site}/work/orders`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const url2 = page.url();
  if (!url2.includes('/work/login')) {
    throw new Error(`Unauthenticated /work/orders should redirect to /work/login, got ${url2}`);
  }
  console.log('OK: /work/orders redirects unauthenticated staff to /work/login');

  // 3) Staff login through UI → dashboard
  await page.fill('#staffId', staffId);
  await page.fill('#password', staffPass);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/work\/?$/, { timeout: 15000 });
  console.log('OK: staff UI login reaches /work dashboard');
} finally {
  await browser.close();
}
EOF

cd "$TMPDIR"
npm init -y >/dev/null 2>&1
npm install playwright@1.61.1 >/dev/null 2>&1
npx playwright install chromium >/dev/null 2>&1

SITE_URL="$SITE" STAFF_ID="$STAFF_ID" STAFF_PASS="$STAFF_PASS" node work-auth.spec.mjs
