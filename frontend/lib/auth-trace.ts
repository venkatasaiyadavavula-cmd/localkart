/** Client/server auth diagnostics — enable via NEXT_PUBLIC_AUTH_TRACE=1 or window.__AUTH_TRACE__ */
export type AuthTraceEvent =
  | 'rehydrate-start'
  | 'rehydrate-done'
  | 'guard-effect'
  | 'guard-await'
  | 'guard-redirect'
  | 'guard-resolved'
  | 'server-session'
  | 'admin-layout'
  | 'seller-layout';

export function authTrace(
  event: AuthTraceEvent,
  detail: Record<string, unknown> = {},
): void {
  const enabled =
    (typeof window !== 'undefined' &&
      (window as Window & { __AUTH_TRACE__?: boolean }).__AUTH_TRACE__ === true) ||
    process.env.NEXT_PUBLIC_AUTH_TRACE === '1';

  if (!enabled) return;

  const payload = { ts: Date.now(), event, ...detail };
  if (typeof window !== 'undefined') {
    console.info('[auth-trace]', JSON.stringify(payload));
  } else {
    console.info('[auth-trace]', payload);
  }
}
