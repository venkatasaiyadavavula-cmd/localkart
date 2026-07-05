"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.MAX_STAFF = void 0;
const staff_member_entity_1 = require("../../core/entities/staff-member.entity");
exports.MAX_STAFF = 5;
exports.ROLE_PERMISSIONS = {
    [staff_member_entity_1.StaffRole.WORKER]: ['products:read', 'products:write', 'inventory:write', 'orders:read', 'orders:write'],
    [staff_member_entity_1.StaffRole.STORE_MANAGER]: ['products:read', 'products:write', 'orders:read', 'orders:write', 'inventory:write'],
    [staff_member_entity_1.StaffRole.PRODUCTS_MANAGER]: ['products:read', 'products:write', 'inventory:write'],
    [staff_member_entity_1.StaffRole.DELIVERY_STAFF]: ['orders:read', 'orders:write'],
};
//# sourceMappingURL=staff-permissions.js.map