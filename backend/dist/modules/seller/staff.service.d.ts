import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { StaffMember, StaffRole, StaffStatus } from '../../core/entities/staff-member.entity';
import { Shop } from '../../core/entities/shop.entity';
import { MAX_STAFF, ROLE_PERMISSIONS } from './staff-permissions';
export { MAX_STAFF, ROLE_PERMISSIONS };
export declare class StaffService {
    private readonly staffRepo;
    private readonly shopRepo;
    private readonly jwtService;
    private readonly logger;
    constructor(staffRepo: Repository<StaffMember>, shopRepo: Repository<Shop>, jwtService: JwtService);
    getStaff(ownerId: string): Promise<{
        permissions: string[];
        isOnline: boolean;
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
    }[]>;
    addStaff(ownerId: string, dto: {
        name: string;
        phone: string;
        role?: StaffRole;
        note?: string;
        staffId?: string;
        password?: string;
    }): Promise<{
        id: string;
        name: string;
        phone: string;
        staffId: string;
        role: StaffRole;
        permissions: string[];
        tempPassword: string;
        message: string;
    }>;
    updateStaff(ownerId: string, staffMemberId: string, dto: {
        role?: StaffRole;
        note?: string;
    }): Promise<{
        permissions: string[];
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
    }>;
    removeStaff(ownerId: string, staffMemberId: string): Promise<{
        success: boolean;
        message: string;
        removedStaffId: string;
        removedName: string;
    }>;
    resetPassword(ownerId: string, staffMemberId: string, newPassword?: string): Promise<{
        success: boolean;
        staffId: string;
        newPassword: string;
        message: string;
    }>;
    staffLogin(staffId: string, password: string): Promise<{
        token: string;
        staff: {
            id: string;
            name: string;
            staffId: string;
            role: StaffRole;
            shopName: string;
            permissions: string[];
        };
    }>;
}
