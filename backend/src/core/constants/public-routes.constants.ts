/**
 * Canonical list of API routes that must remain reachable without a JWT.
 * Used by global-auth regression tests — keep in sync with @Public() decorators.
 */
export interface PublicRouteSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  /** Optional JSON body for POST/PUT routes */
  body?: Record<string, unknown>;
}

/** Full paths relative to /api/v1 */
export const PUBLIC_API_ROUTES: PublicRouteSpec[] = [
  // Auth (logout intentionally excluded — becomes JWT-protected)
  { method: 'POST', path: '/auth/register', body: {} },
  { method: 'POST', path: '/auth/login', body: { phone: '0000000000', password: 'wrong' } },
  { method: 'POST', path: '/auth/send-otp', body: { phone: '0000000000' } },
  { method: 'POST', path: '/auth/verify-otp', body: { phone: '0000000000', otp: '000000' } },
  { method: 'POST', path: '/auth/reset-password', body: {} },
  { method: 'POST', path: '/auth/refresh', body: {} },

  // Webhooks
  { method: 'POST', path: '/webhooks/razorpay', body: {} },

  // Catalog browsing
  { method: 'GET', path: '/catalog/products' },
  { method: 'GET', path: '/catalog/products/sample-slug' },
  { method: 'GET', path: '/catalog/sponsored' },
  { method: 'GET', path: '/catalog/categories' },
  { method: 'GET', path: '/catalog/categories/groceries' },
  { method: 'GET', path: '/catalog/search?q=test' },
  { method: 'POST', path: '/catalog/visual-search', body: {} },
  { method: 'GET', path: '/catalog/shop/00000000-0000-0000-0000-000000000001/products' },
  { method: 'GET', path: '/catalog/today-offers' },
  { method: 'GET', path: '/catalog/featured-videos' },

  // Location
  { method: 'GET', path: '/location/nearby-shops?lat=14.47&lng=78.82' },
  { method: 'GET', path: '/location/search-shops?q=kadapa' },
  { method: 'GET', path: '/location/cities' },
  { method: 'GET', path: '/location/pincodes?city=Kadapa' },
  { method: 'GET', path: '/location/check-serviceability?pincode=516001' },

  // Order tracking
  { method: 'GET', path: '/orders/track/LK-TEST-0001' },

  // Reviews
  { method: 'GET', path: '/reviews/product/00000000-0000-0000-0000-000000000001' },

  // Seller public storefront
  { method: 'GET', path: '/seller/shop/slug/sample-shop' },
  { method: 'GET', path: '/seller/shop/id/00000000-0000-0000-0000-000000000001' },
  { method: 'GET', path: '/seller/subscription/plans' },

  // Staff work-portal login
  { method: 'POST', path: '/seller/staff/login', body: { staffId: 'nobody', password: 'wrong' } },
];

/** Sample protected routes — must reject unauthenticated JWT access */
export const PROTECTED_API_ROUTES: PublicRouteSpec[] = [
  { method: 'GET', path: '/users/profile' },
  { method: 'GET', path: '/cart' },
  { method: 'GET', path: '/orders' },
  { method: 'GET', path: '/wishlist' },
  { method: 'GET', path: '/addresses' },
  { method: 'GET', path: '/admin/dashboard' },
  { method: 'GET', path: '/seller/dashboard' },
  { method: 'GET', path: '/seller/shop' },
  { method: 'POST', path: '/orders', body: {} },
  { method: 'POST', path: '/payments/create-order', body: {} },
  { method: 'GET', path: '/returns' },
  { method: 'GET', path: '/commission/my-bills' },
  { method: 'GET', path: '/staff/work/me' },
  { method: 'POST', path: '/auth/logout' },
];

export const JWT_UNAUTHORIZED_MESSAGE = 'Invalid or expired token';
