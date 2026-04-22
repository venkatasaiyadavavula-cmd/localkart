import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
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
            lastOtp: string;
            lastOtpSentAt: Date;
            shop: import("../../core/entities/shop.entity").Shop;
            orders: import("../../core/entities/order.entity").Order[];
            returnRequests: import("../../core/entities/return-request.entity").ReturnRequest[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    login(req: any): Promise<{
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
    sendOtp(sendOtpDto: SendOtpDto): Promise<{
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
            role: import("../../core/entities/user.entity").UserRole;
            isPhoneVerified: boolean;
        };
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    refreshToken(req: any): Promise<{
        accessToken: string;
    }>;
}
