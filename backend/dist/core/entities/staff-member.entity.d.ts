import { Shop } from './shop.entity';
export declare enum StaffRole {
    PRODUCTS_MANAGER = "products_manager",
    DELIVERY_STAFF = "delivery_staff",
    STORE_MANAGER = "store_manager"
}
export declare enum StaffStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class StaffMember {
    id: string;
    shop: Shop;
    shopId: string;
    name: string;
    phone: string;
    staffId: string;
    passwordHash: string;
    role: StaffRole;
    status: StaffStatus;
    lastLoginAt: Date;
    note: string;
    createdAt: Date;
    updatedAt: Date;
}
