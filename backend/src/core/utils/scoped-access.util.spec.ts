import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { assertScopedResourceAccess, isScopedResourceAllowed } from './scoped-access.util';

const resource = {
  customerId: 'customer-a',
  shopId: 'shop-1',
  shopOwnerId: 'seller-1',
};

describe('scoped-access.util', () => {
  it('allows admin for any resource', () => {
    expect(isScopedResourceAllowed(resource, UserRole.ADMIN, 'anyone')).toBe(true);
  });

  it('allows customer who owns the resource', () => {
    expect(isScopedResourceAllowed(resource, UserRole.CUSTOMER, 'customer-a')).toBe(true);
  });

  it('denies a different customer', () => {
    expect(isScopedResourceAllowed(resource, UserRole.CUSTOMER, 'customer-b')).toBe(false);
    expect(() =>
      assertScopedResourceAccess(resource, UserRole.CUSTOMER, 'customer-b'),
    ).toThrow(ForbiddenException);
  });

  it('allows seller who owns the shop', () => {
    expect(isScopedResourceAllowed(resource, UserRole.SELLER, 'seller-1')).toBe(true);
  });

  it('denies seller from another shop', () => {
    expect(isScopedResourceAllowed(resource, UserRole.SELLER, 'seller-2')).toBe(false);
  });

  it('allows staff of the same shop', () => {
    expect(
      isScopedResourceAllowed(resource, 'staff', 'staff-1', { staffShopId: 'shop-1' }),
    ).toBe(true);
  });

  it('denies staff from another shop', () => {
    expect(
      isScopedResourceAllowed(resource, 'staff', 'staff-1', { staffShopId: 'shop-2' }),
    ).toBe(false);
  });
});
