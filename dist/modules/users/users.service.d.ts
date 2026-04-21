import { Repository } from 'typeorm';
import { User } from '../../core/entities/user.entity';
import { Shop } from '../../core/entities/shop.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private readonly userRepository;
    private readonly shopRepository;
    constructor(userRepository: Repository<User>, shopRepository: Repository<Shop>);
    getProfile(userId: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        role: import("../../core/entities/user.entity").UserRole;
        isPhoneVerified: boolean;
        isActive: boolean;
        address: string;
        latitude: number;
        longitude: number;
        profileImage: string;
        lastOtpSentAt: Date;
        shop: Shop;
        orders: import("../../core/entities/order.entity").Order[];
        returnRequests: import("../../core/entities/return-request.entity").ReturnRequest[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        role: import("../../core/entities/user.entity").UserRole;
        isPhoneVerified: boolean;
        isActive: boolean;
        address: string;
        latitude: number;
        longitude: number;
        profileImage: string;
        lastOtpSentAt: Date;
        shop: Shop;
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
        role: import("../../core/entities/user.entity").UserRole;
        isPhoneVerified: boolean;
        isActive: boolean;
        address: string;
        latitude: number;
        longitude: number;
        profileImage: string;
        lastOtpSentAt: Date;
        shop: Shop;
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
    getShopByOwnerId(ownerId: string): Promise<Shop>;
}
