import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../../core/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { WhatsappService } from '../notifications/whatsapp.service';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly whatsappService;
    private readonly logger;
    constructor(userRepository: Repository<User>, jwtService: JwtService, whatsappService: WhatsappService);
    private normalizePhone;
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            phone: string;
            email: string;
            role: UserRole;
        };
    }>;
    login(user: User): Promise<{
        user: {
            id: string;
            name: string;
            phone: string;
            email: string;
            role: UserRole;
            isPhoneVerified: boolean;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    validateUser(phone: string, password: string): Promise<User>;
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
    logout(userId: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private generateTokens;
}
