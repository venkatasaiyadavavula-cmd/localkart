import * as fs from 'fs';
import * as path from 'path';

export type RouteRole = 'public' | 'customer' | 'seller' | 'admin' | 'staff' | 'staff-login';

export interface AppRoute {
  /** Resolved path ready for page.goto (no dynamic segments). */
  path: string;
  /** Template from app router, e.g. /orders/[id]. */
  template: string;
  role: RouteRole;
}

const APP_DIR = path.join(__dirname, '../../frontend/app');

/** Convert frontend/app/(group)/foo/[id]/page.tsx → /foo/[id] */
function pageFileToTemplate(relativePath: string): string {
  const withoutPage = relativePath.replace(/\/page\.tsx$/, '');
  const segments = withoutPage.split('/').filter((seg) => !seg.startsWith('('));
  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

function inferRole(template: string): RouteRole {
  if (template === '/work/login') return 'staff-login';
  if (template.startsWith('/admin')) return 'admin';
  if (template.startsWith('/dashboard') || template === '/seller-onboarding') return 'seller';
  if (template.startsWith('/work')) return 'staff';
  if (
    template === '/wishlist' ||
    template === '/profile' ||
    template.startsWith('/profile/') ||
    template === '/checkout' ||
    template.startsWith('/checkout/') ||
    template === '/orders' ||
    (template.startsWith('/orders/') && template !== '/orders/track') ||
    template.startsWith('/returns/')
  ) {
    return 'customer';
  }
  return 'public';
}

function walkPageFiles(dir: string, base = ''): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...walkPageFiles(path.join(dir, entry.name), rel));
    } else if (entry.name === 'page.tsx') {
      files.push(rel);
    }
  }
  return files;
}

/** All distinct page routes from frontend/app (source of truth). */
export function discoverRouteTemplates(): string[] {
  const pages = walkPageFiles(APP_DIR);
  const templates = pages.map(pageFileToTemplate);
  return [...new Set(templates)].sort();
}

export function templateHasDynamicSegments(template: string): boolean {
  return /\[[^\]]+\]/.test(template);
}

export function discoverStaticRoutes(): AppRoute[] {
  return discoverRouteTemplates()
    .filter((t) => !templateHasDynamicSegments(t))
    .map((template) => ({
      template,
      path: template,
      role: inferRole(template),
    }));
}
