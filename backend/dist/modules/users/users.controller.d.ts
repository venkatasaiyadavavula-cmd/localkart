import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '../../core/entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        role: UserRole;
        isPhoneVerified: boolean;
        isActive: boolean;
        address: string;
        latitude: number;
        longitude: number;
        profileImage: string;
        lastOtpSentAt: Date;
        shop: import("../../core/entities/shop.entity").Shop;
        orders: import("../../core/entities/order.entity").Order[];
        returnRequests: import("../../core/entities/return-request.entity").ReturnRequest[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(user: any, updateProfileDto: UpdateProfileDto): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        role: UserRole;
        isPhoneVerified: boolean;
        isActive: boolean;
        address: string;
        latitude: number;
        longitude: number;
        profileImage: string;
        lastOtpSentAt: Date;
        shop: import("../../core/entities/shop.entity").Shop;
        orders: import("../../core/entities/order.entity").Order[];
        returnRequests: import("../../core/entities/return-request.entity").ReturnRequest[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserById(id: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        role: UserRole;
        isPhoneVerified: boolean;
        isActive: boolean;
        address: string;
        latitude: number;
        longitude: number;
        profileImage: string;
        lastOtpSentAt: Date;
        shop: import("../../core/entities/shop.entity").Shop;
        orders: import("../../core/entities/order.entity").Order[];
        returnRequests: import("../../core/entities/return-request.entity").ReturnRequest[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    deactivateUser(id: string): Promise<{
        message: string;
    }>;
    activateUser(id: string): Promise<{
        message: string;
    }>;
    getMyShop(user: any): Promise<import("../../core/entities/shop.entity").Shop>;
}
