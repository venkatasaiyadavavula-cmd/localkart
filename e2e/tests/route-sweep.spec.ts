import * as fs from 'fs';
import * as path from 'path';
import { test } from '../qa-fixtures';
import {
  clearAuth,
  loginAdmin,
  loginCustomer,
  loginSeller,
  loginStaff,
  SITE,
} from '../helpers';
import { attachRouteCollectors, installUnhandledRejectionHook, isRouteClean, type RouteSweepResult } from '../route-sweep/collect-errors';
import { discoverStaticRoutes, type AppRoute, type RouteRole } from '../route-sweep/discover-routes';
import { expandDynamicRoutes, fetchDynamicRouteContext } from '../route-sweep/resolve-dynamic';

const SETTLE_MS = 4_000;
const REPORT_JSON = path.join(__dirname, '../route-sweep-report.json');
const REPORT_MD = path.join(__dirname, '../route-sweep-report.md');

function dedupeRoutes(routes: AppRoute[]): AppRoute[] {
  const seen = new Set<string>();
  const out: AppRoute[] = [];
  for (const r of routes) {
    const key = `${r.role}::${r.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function buildAllRoutes(staticRoutes: AppRoute[], dynamicRoutes: AppRoute[]): AppRoute[] {
  const extra: AppRoute[] = [
    { template: '/browse?sale=true', path: '/browse?sale=true', role: 'public' },
  ];
  return dedupeRoutes([...staticRoutes, ...dynamicRoutes, ...extra]);
}

async function ensureAuth(page: import('@playwright/test').Page, role: RouteRole) {
  if (role === 'public' || role === 'staff-login') {
    await clearAuth(page);
    return;
  }
  await clearAuth(page);
  if (role === 'customer') await loginCustomer(page);
  else if (role === 'seller') await loginSeller(page);
  else if (role === 'admin') await loginAdmin(page);
  else if (role === 'staff') await loginStaff(page);
}

function formatIssues(result: RouteSweepResult): string {
  if (isRouteClean(result)) return '**Clean** — no console errors/warnings, no 4xx/5xx API failures, no unhandled rejections.';

  const lines: string[] = [];
  if (result.navigationError) {
    lines.push(`- **Navigation error:** ${result.navigationError}`);
  }
  for (const issue of result.consoleIssues) {
    lines.push(`- **${issue.kind}:** \`${issue.text.replace(/`/g, "'")}\``);
  }
  for (const net of result.networkIssues) {
    lines.push(`- **network ${net.status}:** \`${net.method} ${net.url}\``);
  }
  return lines.join('\n');
}

function renderMarkdownReport(results: RouteSweepResult[]): string {
  const clean = results.filter(isRouteClean).length;
  const dirty = results.length - clean;
  const lines: string[] = [
    `# LocalKart route sweep — ${SITE}`,
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `**Summary:** ${results.length} routes scanned — ${clean} clean, ${dirty} with issues.`,
    '',
    '| Route | Role | Status | Issues |',
    '| --- | --- | --- | --- |',
  ];

  for (const r of results) {
    const status = isRouteClean(r) ? 'Clean' : 'Issues';
    const issues = isRouteClean(r)
      ? '—'
      : formatIssues(r).replace(/\n/g, '<br>').replace(/\|/g, '\\|');
    lines.push(`| \`${r.path}\` | ${r.role} | ${status} | ${issues} |`);
  }

  lines.push('', '## Full detail', '');
  for (const r of results) {
    lines.push(`### \`${r.path}\` (${r.role})`);
    lines.push(`- Template: \`${r.template}\``);
    lines.push(`- Final URL: \`${r.finalUrl}\``);
    lines.push(formatIssues(r));
    lines.push('');
  }

  return lines.join('\n');
}

test.describe.configure({ mode: 'serial', timeout: 600_000 });

test('Route sweep — console, network, unhandled rejections', async ({ page, request }) => {
  const staticRoutes = discoverStaticRoutes();
  const dynamicCtx = await fetchDynamicRouteContext(request);
  const allRoutes = buildAllRoutes(staticRoutes, expandDynamicRoutes(dynamicCtx));

  console.log(`\n🔍 Route sweep: ${allRoutes.length} routes on ${SITE}\n`);

  const results: RouteSweepResult[] = [];
  await installUnhandledRejectionHook(page);
  const collectors = attachRouteCollectors(page);

  const routesByRole = new Map<RouteRole, AppRoute[]>();
  for (const route of allRoutes) {
    const list = routesByRole.get(route.role) ?? [];
    list.push(route);
    routesByRole.set(route.role, list);
  }

  const roleOrder: RouteRole[] = ['public', 'staff-login', 'customer', 'seller', 'admin', 'staff'];

  for (const role of roleOrder) {
    const roleRoutes = routesByRole.get(role);
    if (!roleRoutes?.length) continue;

    await ensureAuth(page, role);

    for (const route of roleRoutes) {
      collectors.reset();

      let navigationError: string | undefined;
      let finalUrl = '';
      try {
        await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        finalUrl = page.url();
        await page.waitForTimeout(SETTLE_MS);
      } catch (err) {
        navigationError = err instanceof Error ? err.message : String(err);
        finalUrl = page.url();
      }

      if (
        route.role !== 'public' &&
        route.role !== 'staff-login' &&
        finalUrl.includes('/login')
      ) {
        navigationError =
          navigationError || `Redirected to login — expected authenticated ${route.role} session`;
      }

      results.push({
        path: route.path,
        template: route.template,
        role: route.role,
        finalUrl,
        consoleIssues: [...collectors.consoleIssues],
        networkIssues: [...collectors.networkIssues],
        navigationError,
      });

      const label = isRouteClean(results[results.length - 1]) ? '✅ clean' : '❌ issues';
      console.log(`${label}  [${route.role}] ${route.path}`);
    }
  }

  results.sort((a, b) => a.path.localeCompare(b.path));

  fs.writeFileSync(REPORT_JSON, JSON.stringify(results, null, 2));
  fs.writeFileSync(REPORT_MD, renderMarkdownReport(results));

  console.log(`\n📄 Reports written:\n  ${REPORT_JSON}\n  ${REPORT_MD}\n`);

  // Print compact table for CI logs.
  console.log('\n| Route | Role | Status |');
  console.log('| --- | --- | --- |');
  for (const r of results) {
    console.log(`| ${r.path} | ${r.role} | ${isRouteClean(r) ? 'Clean' : 'Issues'} |`);
  }
});
