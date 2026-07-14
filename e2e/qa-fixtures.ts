import { test as base, expect } from '@playwright/test';

/** API host only — bypass header must NOT be sent to fonts/CDN (breaks CORS). */
const API_HOST = (process.env.API_URL || 'https://api.localkart.store/api/v1')
  .replace(/^https?:\/\//, '')
  .split('/')[0];

export const test = base.extend({
  page: async ({ page }, use) => {
    const token = process.env.QA_THROTTLE_BYPASS_TOKEN;
    if (token) {
      await page.route(`**${API_HOST}/**`, async (route) => {
        if (route.request().method() === 'OPTIONS') {
          await route.continue();
          return;
        }
        // Playwright replaces (not merges) headers when continue({ headers }) is set.
        // Spread existing headers but omit hop-by-hop fields the browser manages.
        const headers = { ...route.request().headers() };
        for (const key of ['content-length', 'host', 'connection', 'transfer-encoding']) {
          delete headers[key];
        }
        headers['x-qa-throttle-bypass'] = token;
        await route.continue({ headers });
      });
    }
    await use(page);
  },
});

export { expect };
