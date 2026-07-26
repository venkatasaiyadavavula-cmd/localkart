import { StaffRole } from '../../core/entities/staff-member.entity';
import { EMPLOYEE_PERMISSIONS, resolveStaffPermissions } from './staff-permissions';

describe('staff-permissions', () => {
  it('grants full employee permissions for EMPLOYEE role', () => {
    const perms = resolveStaffPermissions(StaffRole.EMPLOYEE);
    expect(perms).toEqual([...EMPLOYEE_PERMISSIONS]);
    expect(perms).toContain('products:write');
    expect(perms).toContain('orders:write');
  });

  it('maps legacy roles to the same employee permission set', () => {
    for (const legacy of [
      StaffRole.WORKER,
      StaffRole.STORE_MANAGER,
      StaffRole.PRODUCTS_MANAGER,
      StaffRole.DELIVERY_STAFF,
    ]) {
      expect(resolveStaffPermissions(legacy)).toEqual([...EMPLOYEE_PERMISSIONS]);
    }
  });
});
