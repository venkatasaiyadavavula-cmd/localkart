import { StaffRole } from '../../core/entities/staff-member.entity';

export const MAX_STAFF = 5;

/**
 * Permissions for shop employees using the /staff/work portal.
 * Owner-only actions (subscription, commission pay, staff CRUD, seller dashboard, shop settings, ads billing)
 * are blocked by JwtAuthGuard + UserRole.SELLER — not by missing permissions here.
 */
export const EMPLOYEE_PERMISSIONS: readonly string[] = [
  'products:read',
  'products:write',
  'inventory:write',
  'orders:read',
  'orders:write',
] as const;

const LEGACY_ROLE_VALUES = new Set<string>([
  StaffRole.WORKER,
  StaffRole.STORE_MANAGER,
  StaffRole.PRODUCTS_MANAGER,
  StaffRole.DELIVERY_STAFF,
]);

/** Central permission resolver — all staff roles map to the same employee capability set after collapse. */
export function resolveStaffPermissions(role: StaffRole | string): string[] {
  if (role === StaffRole.EMPLOYEE || LEGACY_ROLE_VALUES.has(String(role))) {
    return [...EMPLOYEE_PERMISSIONS];
  }
  return [...EMPLOYEE_PERMISSIONS];
}

export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  [StaffRole.EMPLOYEE]: [...EMPLOYEE_PERMISSIONS],
  [StaffRole.WORKER]: [...EMPLOYEE_PERMISSIONS],
  [StaffRole.STORE_MANAGER]: [...EMPLOYEE_PERMISSIONS],
  [StaffRole.PRODUCTS_MANAGER]: [...EMPLOYEE_PERMISSIONS],
  [StaffRole.DELIVERY_STAFF]: [...EMPLOYEE_PERMISSIONS],
};
