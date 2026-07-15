import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export type ScopedResource = {
  customerId: string;
  shopId: string;
  /** Prefer when shop relation is loaded (orders). */
  shopOwnerId?: string;
};

/**
 * Returns true when role may read a customer/shop-scoped resource.
 * Admin → always. Customer → own resource. Seller → own shop. Staff → same shop.
 */
export function isScopedResourceAllowed(
  resource: ScopedResource,
  role: UserRole | string,
  userId: string,
  options?: { staffShopId?: string; sellerShopId?: string },
): boolean {
  if (role === UserRole.ADMIN) return true;
  if (role === UserRole.CUSTOMER) return resource.customerId === userId;
  if (role === UserRole.SELLER) {
    if (resource.shopOwnerId) return resource.shopOwnerId === userId;
    return !!options?.sellerShopId && options.sellerShopId === resource.shopId;
  }
  if (role === 'staff') {
    return !!options?.staffShopId && resource.shopId === options.staffShopId;
  }
  return false;
}

export function assertScopedResourceAccess(
  resource: ScopedResource,
  role: UserRole | string,
  userId: string,
  options?: { staffShopId?: string; sellerShopId?: string },
): void {
  if (!isScopedResourceAllowed(resource, role, userId, options)) {
    throw new ForbiddenException('Access denied');
  }
}
