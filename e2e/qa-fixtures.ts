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
        await route.continue({
          headers: {
            ...route.request().headers(),
            'x-qa-throttle-bypass': token,
          },
        });
      });
    }
    await use(page);
  },
});

export { expect };
