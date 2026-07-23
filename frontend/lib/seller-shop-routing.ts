export type SellerShopStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

const VALID_STATUSES = new Set<SellerShopStatus>([
  'pending',
  'approved',
  'rejected',
  'suspended',
]);

export interface SellerShopUser {
  shopId?: string;
  shopName?: string | null;
  shopStatus?: string | null;
  shop?: {
    id?: string;
    name?: string;
    status?: string;
    createdAt?: string;
  };
}

export interface SellerShopContext {
  hasShop: boolean;
  shopId?: string;
  shopName?: string;
  shopStatus?: SellerShopStatus | null;
  submittedAt?: string | null;
}

export function normalizeSellerShopStatus(
  status: string | null | undefined,
): SellerShopStatus | null {
  if (!status) return null;
  return VALID_STATUSES.has(status as SellerShopStatus)
    ? (status as SellerShopStatus)
    : null;
}

export function resolveSellerShopContext(
  user: SellerShopUser | null | undefined,
): SellerShopContext {
  const shopId = user?.shopId ?? user?.shop?.id;
  const hasShop = !!shopId;

  return {
    hasShop,
    shopId,
    shopName: user?.shopName ?? user?.shop?.name ?? undefined,
    shopStatus: normalizeSellerShopStatus(
      user?.shopStatus ?? user?.shop?.status ?? null,
    ),
    submittedAt: user?.shop?.createdAt ?? null,
  };
}

/** True only when the seller has no shop record yet. */
export function shouldShowOnboardingForm(ctx: SellerShopContext): boolean {
  return !ctx.hasShop;
}

export function shouldShowPendingScreen(ctx: SellerShopContext): boolean {
  return ctx.hasShop && ctx.shopStatus === 'pending';
}

export function shouldShowRejectedScreen(ctx: SellerShopContext): boolean {
  return ctx.hasShop && ctx.shopStatus === 'rejected';
}

export function shouldShowSuspendedScreen(ctx: SellerShopContext): boolean {
  return ctx.hasShop && ctx.shopStatus === 'suspended';
}

export function shouldAllowDashboard(ctx: SellerShopContext): boolean {
  return ctx.hasShop && ctx.shopStatus === 'approved';
}
