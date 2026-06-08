import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../../core/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/otp.dto';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly logger;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
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
            lastOtp: string;
            lastOtpSentAt: Date;
            shop: import("../../core/entities/shop.entity").Shop;
            orders: import("../../core/entities/order.entity").Order[];
            returnRequests: import("../../core/entities/return-request.entity").ReturnRequest[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    validateUser(phone: string, password: string): Promise<any>;
    login(user: any): Promise<{
        accessToken: string;
        user: {
            id: any;
            name: any;
            phone: any;
            email: any;
            role: any;
            isPhoneVerified: any;
        };
    }>;
    sendOtp(phone: string): Promise<{
        message: string;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            email: string;
            role: UserRole;
            isPhoneVerified: boolean;
        };
    }>;
    refreshToken(user: any): Promise<{
        accessToken: string;
    }>;
}
