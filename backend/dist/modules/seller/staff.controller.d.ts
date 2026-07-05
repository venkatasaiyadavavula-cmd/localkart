import { StaffService } from './staff.service';
import { StaffRole } from '../../core/entities/staff-member.entity';
declare class AddStaffDto {
    name: string;
    phone: string;
    role?: StaffRole;
    note?: string;
    staffId?: string;
    password?: string;
}
declare class UpdateStaffDto {
    role?: StaffRole;
    note?: string;
}
declare class StaffLoginDto {
    staffId: string;
    password: string;
}
declare class ResetPasswordDto {
    password?: string;
}
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    getStaff(req: any): Promise<{
        permissions: string[];
        isOnline: boolean;
        id: string;
        shop: import("../../core/entities/shop.entity").Shop;
        shopId: string;
        name: string;
        phone: string;
        staffId: string;
        passwordHash: string;
        role: StaffRole;
        status: import("../../core/entities/staff-member.entity").StaffStatus;
        lastLoginAt: Date;
        note: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    addStaff(req: any, dto: AddStaffDto): Promise<{
        id: string;
        name: string;
        phone: string;
        staffId: string;
        role: StaffRole;
        permissions: string[];
        tempPassword: string;
        message: string;
    }>;
    updateStaff(req: any, id: string, dto: UpdateStaffDto): Promise<{
        permissions: string[];
        id: string;
        shop: import("../../core/entities/shop.entity").Shop;
        shopId: string;
        name: string;
        phone: string;
        staffId: string;
        passwordHash: string;
        role: StaffRole;
        status: import("../../core/entities/staff-member.entity").StaffStatus;
        lastLoginAt: Date;
        note: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeStaff(req: any, id: string): Promise<{
        success: boolean;
        message: string;
        removedStaffId: string;
        removedName: string;
    }>;
    resetPassword(req: any, id: string, dto: ResetPasswordDto): Promise<{
        success: boolean;
        staffId: string;
        newPassword: string;
        message: string;
    }>;
    staffLogin(dto: StaffLoginDto): Promise<{
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
export {};
