/** Customer routes that require login (used by AuthGuard). */
export const CUSTOMER_PROTECTED_ROUTE_PREFIXES = [
  '/cart',
  '/wishlist',
  '/orders',
  '/profile',
  '/returns',
] as const;

export function isCustomerProtectedRoute(pathname: string): boolean {
  return CUSTOMER_PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
