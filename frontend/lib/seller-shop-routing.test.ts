import {
  resolveSellerShopContext,
  shouldAllowDashboard,
  shouldShowOnboardingForm,
  shouldShowPendingScreen,
  shouldShowRejectedScreen,
  shouldShowSuspendedScreen,
} from './seller-shop-routing';

describe('resolveSellerShopContext', () => {
  it('treats missing shop as new seller', () => {
    const ctx = resolveSellerShopContext({ role: 'seller' } as never);
    expect(ctx.hasShop).toBe(false);
    expect(shouldShowOnboardingForm(ctx)).toBe(true);
  });

  it('detects pending shop from nested shop object', () => {
    const ctx = resolveSellerShopContext({
      shop: {
        id: 'shop-1',
        name: 'Test Kirana',
        status: 'pending',
        createdAt: '2026-07-20T10:00:00.000Z',
      },
    });

    expect(ctx).toEqual({
      hasShop: true,
      shopId: 'shop-1',
      shopName: 'Test Kirana',
      shopStatus: 'pending',
      submittedAt: '2026-07-20T10:00:00.000Z',
    });
    expect(shouldShowPendingScreen(ctx)).toBe(true);
    expect(shouldShowOnboardingForm(ctx)).toBe(false);
    expect(shouldAllowDashboard(ctx)).toBe(false);
  });

  it('routes approved shops to dashboard', () => {
    const ctx = resolveSellerShopContext({
      shopId: 'shop-2',
      shopStatus: 'approved',
      shopName: 'Approved Store',
    });

    expect(shouldAllowDashboard(ctx)).toBe(true);
    expect(shouldShowPendingScreen(ctx)).toBe(false);
    expect(shouldShowOnboardingForm(ctx)).toBe(false);
  });

  it('routes rejected and suspended shops to status screens', () => {
    const rejected = resolveSellerShopContext({
      shopId: 'shop-3',
      shopStatus: 'rejected',
    });
    const suspended = resolveSellerShopContext({
      shopId: 'shop-4',
      shopStatus: 'suspended',
    });

    expect(shouldShowRejectedScreen(rejected)).toBe(true);
    expect(shouldShowSuspendedScreen(suspended)).toBe(true);
  });
});
