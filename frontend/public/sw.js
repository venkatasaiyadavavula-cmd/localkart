/**
 * LocalKart minimal service worker for TWA / PWABuilder.
 * Caches static assets only — never API or dynamic commerce routes.
 */
const CACHE_VERSION = '2026-08-01';
const CACHE_NAME = `localkart-static-${CACHE_VERSION}`;

/** Precached on install — static shell assets only (no HTML documents). */
const PRECACHE_URLS = [
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/assets/placeholders/product-placeholder.svg',
  '/assets/placeholders/shop-banner.svg',
];

/** Document routes that must always use the network (no SW cache fallback). */
const NO_CACHE_PATH_PREFIXES = [
  '/checkout',
  '/cart',
  '/orders',
];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isApiRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/api/v1')
  );
}

function isCriticalRoute(url) {
  const path = url.pathname;
  return NO_CACHE_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function isCacheableStaticAsset(url) {
  const path = url.pathname;

  if (path.startsWith('/_next/static/')) return true;
  if (path.startsWith('/icons/')) return true;
  if (path.startsWith('/assets/')) return true;
  if (path === '/manifest.json') return true;
  if (path === '/favicon.ico') return true;
  if (path === '/logo.svg') return true;

  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('localkart-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (!isSameOrigin(url)) return;
  if (isApiRequest(url)) return;
  if (isCriticalRoute(url)) return;
  if (!isCacheableStaticAsset(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        if (cached) return cached;
        throw new Error('Network unavailable and no cache entry');
      }
    }),
  );
});
