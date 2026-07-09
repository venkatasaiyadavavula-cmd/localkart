/**
 * Single source of truth for the public API base URL.
 * Next.js inlines NEXT_PUBLIC_* at build time — deploy must set this env var
 * before `next build` (see deploy.yml). Fallback is production, never localhost.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.localkart.store/api/v1';

/** WebSocket origin derived from API_URL (http→ws, strip /api/v1 path). */
export function getApiWebSocketOrigin(): string {
  return API_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '');
}
