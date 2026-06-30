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
        };
    }>;
    login(req: any): Promise<{
        user: {
            id: string;
            name: string;
            phone: string;
            email: string;
            role: import("../../core/entities/user.entity").UserRole;
            isPhoneVerified: boolean;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    sendOtp(sendOtpDto: SendOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        user: {
            id: any;
            name: any;
            phone: any;
            email: any;
            role: any;
            isPhoneVerified: boolean;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    refreshToken(req: any): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
