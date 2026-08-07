import type { Page, Response } from '@playwright/test';
import { API } from '../helpers';

const API_HOST = API.replace(/^https?:\/\//, '').split('/')[0];

export type ConsoleIssue = {
  kind: 'console-error' | 'console-warning' | 'pageerror' | 'unhandled-rejection';
  text: string;
};

export type NetworkIssue = {
  status: number;
  method: string;
  url: string;
};

export type RouteSweepResult = {
  path: string;
  template: string;
  role: string;
  finalUrl: string;
  consoleIssues: ConsoleIssue[];
  networkIssues: NetworkIssue[];
  navigationError?: string;
};

function isTrackedNetworkUrl(url: string): boolean {
  if (url.includes(API_HOST)) return true;
  try {
    const u = new URL(url);
    if (u.pathname.startsWith('/api/')) return true;
    if (u.pathname.startsWith('/_next/data/')) return true;
  } catch {
    return false;
  }
  return false;
}

export function attachRouteCollectors(page: Page) {
  const consoleIssues: ConsoleIssue[] = [];
  const networkIssues: NetworkIssue[] = [];

  const onConsole = (msg: import('@playwright/test').ConsoleMessage) => {
    const type = msg.type();
    if (type !== 'error' && type !== 'warning') return;
    const loc = msg.location();
    const where = loc.url ? ` @ ${loc.url}:${loc.lineNumber ?? 0}` : '';
    const text = `${msg.text()}${where}`;
    consoleIssues.push({
      kind: type === 'error' ? 'console-error' : 'console-warning',
      text,
    });
  };

  const onPageError = (err: Error) => {
    const stack = err.stack || err.message;
    consoleIssues.push({ kind: 'pageerror', text: stack });
  };

  const onResponse = (response: Response) => {
    const status = response.status();
    if (status < 400) return;
    const url = response.url();
    if (!isTrackedNetworkUrl(url)) return;
    const req = response.request();
    networkIssues.push({
      status,
      method: req.method(),
      url,
    });
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('response', onResponse);

  return {
    consoleIssues,
    networkIssues,
    reset() {
      consoleIssues.length = 0;
      networkIssues.length = 0;
    },
    detach() {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('response', onResponse);
    },
  };
}

export async function installUnhandledRejectionHook(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const text =
        reason instanceof Error
          ? reason.stack || reason.message
          : typeof reason === 'string'
            ? reason
            : JSON.stringify(reason);
      // Surfaces as console.error so our console listener picks it up.
      console.error(`Unhandled promise rejection: ${text}`);
    });
  });
}

export function isRouteClean(result: RouteSweepResult): boolean {
  return (
    !result.navigationError &&
    result.consoleIssues.length === 0 &&
    result.networkIssues.length === 0
  );
}
