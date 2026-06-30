import { Shop } from './shop.entity';
import { Order } from './order.entity';
import { ReturnRequest } from './return-request.entity';
export declare enum UserRole {
    CUSTOMER = "customer",
    SELLER = "seller",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    name: string;
    phone: string;
    email: string;
    password: string;
    role: UserRole;
    isPhoneVerified: boolean;
    isActive: boolean;
    address: string;
    latitude: number;
    longitude: number;
    profileImage: string;
    lastOtp: string;
    lastOtpSentAt: Date;
    shop: Shop;
    orders: Order[];
    returnRequests: ReturnRequest[];
    createdAt: Date;
    updatedAt: Date;
}
