'use client';

import { useEffect } from 'react';

/**
 * Registers the production service worker for TWA / offline static assets.
 * Skipped in development to avoid stale caches during local work.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Registration can fail in unsupported contexts; non-fatal for the app.
    });
  }, []);

  return null;
}
