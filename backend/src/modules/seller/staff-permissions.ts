import { StaffRole } from '../../core/entities/staff-member.entity';

export const MAX_STAFF = 5;

export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  [StaffRole.WORKER]:           ['products:read','products:write','inventory:write','orders:read','orders:write'],
  [StaffRole.STORE_MANAGER]:    ['products:read','products:write','orders:read','orders:write','inventory:write'],
  [StaffRole.PRODUCTS_MANAGER]: ['products:read','products:write','inventory:write'],
  [StaffRole.DELIVERY_STAFF]:   ['orders:read','orders:write'],
};
