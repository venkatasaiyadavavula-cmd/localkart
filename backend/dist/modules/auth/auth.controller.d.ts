import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
