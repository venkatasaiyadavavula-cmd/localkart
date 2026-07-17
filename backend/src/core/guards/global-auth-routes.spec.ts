import { PUBLIC_API_ROUTES, PROTECTED_API_ROUTES } from '../constants/public-routes.constants';

/**
 * Static registry sanity checks — ensures the canonical route lists stay complete.
 * HTTP behavior is verified in test/global-auth-routes.e2e-spec.ts.
 */
describe('Global auth route registry', () => {
  it('lists every known-public route from the security audit', () => {
    const paths = PUBLIC_API_ROUTES.map((r) => `${r.method} ${r.path.split('?')[0]}`);

    const expected = [
      'POST /auth/register',
      'POST /auth/login',
      'POST /auth/send-otp',
      'POST /auth/verify-otp',
      'POST /auth/reset-password',
      'POST /auth/refresh',
      'POST /webhooks/razorpay',
      'GET /catalog/products',
      'GET /catalog/products/sample-slug',
      'GET /catalog/sponsored',
      'GET /catalog/categories',
      'GET /catalog/categories/groceries',
      'GET /catalog/search',
      'POST /catalog/visual-search',
      'GET /catalog/shop/00000000-0000-0000-0000-000000000001/products',
      'GET /catalog/today-offers',
      'GET /catalog/featured-videos',
      'GET /location/nearby-shops',
      'GET /location/search-shops',
      'GET /location/cities',
      'GET /location/pincodes',
      'GET /location/check-serviceability',
      'GET /orders/track/LK-TEST-0001',
      'GET /reviews/product/00000000-0000-0000-0000-000000000001',
      'GET /seller/shop/slug/sample-shop',
      'GET /seller/shop/id/00000000-0000-0000-0000-000000000001',
      'GET /seller/subscription/plans',
      'POST /seller/staff/login',
    ];

    for (const route of expected) {
      expect(paths).toContain(route);
    }
    expect(PUBLIC_API_ROUTES).toHaveLength(expected.length);
  });

  it('does not include /auth/logout in public routes', () => {
    const logoutPublic = PUBLIC_API_ROUTES.some((r) => r.path === '/auth/logout');
    expect(logoutPublic).toBe(false);
  });

  it('includes /auth/logout in protected sample routes', () => {
    const logoutProtected = PROTECTED_API_ROUTES.some(
      (r) => r.method === 'POST' && r.path === '/auth/logout',
    );
    expect(logoutProtected).toBe(true);
  });
});
