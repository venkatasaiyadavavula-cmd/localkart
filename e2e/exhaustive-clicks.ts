import { Page, Locator } from '@playwright/test';
import { assertStyled, report } from './helpers';

const DESTRUCTIVE =
  /\b(delete|remove|logout|log out|sign out|suspend|reject return|reject order|cancel order|place cod|place order|confirm payment|pay now|submit return|reset password|clear cart|empty cart)\b/i;
const EXTERNAL_SKIP = /^(https?:\/\/|mailto:|tel:|javascript:)/i;
const SUBMIT_SKIP = /\b(submit|save profile|save hours|save changes|publish|send otp|verify)\b/i;

export type ExhaustiveOptions = {
  /** Skip elements whose visible text matches */
  skipText?: RegExp;
  /** Max elements to click (default: all) */
  maxClicks?: number;
  /** Allow navigation away without returning */
  allowNavigate?: boolean;
};

async function getInteractives(page: Page): Promise<Locator[]> {
  const selector = [
    'a[href]',
    'button',
    '[role="button"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="switch"]',
    'input[type="submit"]',
    'summary',
  ].join(', ');

  const all = await page.locator(selector).all();
  const visible: Locator[] = [];

  for (const loc of all) {
    try {
      if (await loc.isVisible({ timeout: 500 })) {
        visible.push(loc);
      }
    } catch {
      /* not visible */
    }
  }
  return visible;
}

async function describeElement(loc: Locator): Promise<string> {
  const tag = await loc.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'el');
  const text = (await loc.innerText().catch(() => '')).trim().replace(/\s+/g, ' ').slice(0, 50);
  const href = await loc.getAttribute('href').catch(() => null);
  const aria = await loc.getAttribute('aria-label').catch(() => null);
  return `${tag}:${text || aria || href || 'unnamed'}`;
}

/**
 * Click every visible interactive element on the current page.
 * Re-navigates to `route` after each click that leaves the page.
 */
export async function exhaustPageClicks(
  page: Page,
  route: string,
  pageLabel: string,
  errors: string[],
  options: ExhaustiveOptions = {},
): Promise<{ clicked: number; skipped: number; failed: number }> {
  const skipExtra = options.skipText;
  let clicked = 0;
  let skipped = 0;
  let failed = 0;

  await page.goto(route, { waitUntil: 'networkidle' });
  await assertStyled(page, pageLabel);

  const interactives = await getInteractives(page);
  const limit = options.maxClicks ?? interactives.length;

  for (let i = 0; i < Math.min(interactives.length, limit); i++) {
    // Re-open page each iteration — prior clicks may have changed DOM
    if (i > 0) {
      await page.goto(route, { waitUntil: 'networkidle' });
    }

    const fresh = await getInteractives(page);
    if (i >= fresh.length) break;

    const loc = fresh[i];
    const desc = await describeElement(loc);
    const label = `${pageLabel} → ${desc}`;
    const text = desc.toLowerCase();

    const href = await loc.getAttribute('href').catch(() => null);
    if (href && EXTERNAL_SKIP.test(href)) {
      report(label, 'skip', 'external/mailto');
      skipped++;
      continue;
    }
    if (DESTRUCTIVE.test(text) || SUBMIT_SKIP.test(text) || (skipExtra && skipExtra.test(text))) {
      report(label, 'skip', 'destructive/submit skipped');
      skipped++;
      continue;
    }

    const errBefore = errors.length;
    const urlBefore = page.url();

    try {
      await loc.scrollIntoViewIfNeeded();
      await loc.click({ timeout: 8_000, force: true });
      await page.waitForTimeout(600);

      const newErrs = errors
        .slice(errBefore)
        .filter((e) => !/favicon|manifest|ResizeObserver|hydration/i.test(e));

      if (newErrs.length) {
        report(label, 'fail', newErrs[0].slice(0, 100));
        failed++;
      } else {
        const urlAfter = page.url();
        const dialogOpen = (await page.locator('[role="dialog"], [data-state="open"]').count()) > 0;
        const changed = urlAfter !== urlBefore || dialogOpen;
        if (changed) {
          report(label, 'pass');
          clicked++;
        } else {
          report(label, 'skip', 'toggle/no visible effect');
          skipped++;
        }
      }

      if (!options.allowNavigate && !page.url().includes(new URL(route, page.url()).pathname)) {
        const path = route.split('?')[0];
        if (!page.url().includes(path)) {
          await page.goto(route, { waitUntil: 'networkidle' });
        }
      } else if (page.url() !== urlBefore && route.startsWith('/')) {
        const basePath = route.split('?')[0];
        if (!page.url().includes(basePath)) {
          await page.goto(route, { waitUntil: 'networkidle' });
        }
      }

      await page.keyboard.press('Escape').catch(() => {});
    } catch (e) {
      report(label, 'fail', String(e).message?.slice(0, 100) || 'click failed');
      failed++;
      await page.goto(route, { waitUntil: 'networkidle' }).catch(() => {});
    }
  }

  return { clicked, skipped, failed };
}
