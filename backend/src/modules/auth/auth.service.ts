import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../core/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { phone, email, password, name, role } = registerDto;

    // Check existing user
    const existingUser = await this.userRepository.findOne({
      where: [{ phone }, { email }],
    });
    if (existingUser) {
      throw new ConflictException('User with this phone or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      phone,
      email,
      name,
      password: hashedPassword,
      role: role || UserRole.CUSTOMER,
      isPhoneVerified: false,
    });

    await this.userRepository.save(user);

    // Send OTP for verification
    await this.sendOtp(phone);

    const { password: _, ...userWithoutPassword } = user;
    return {
      message: 'Registration successful. Please verify your phone number with OTP.',
      user: userWithoutPassword,
    };
  }

  async validateUser(phone: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      email: user.email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
      },
    };
  }

  async sendOtp(phone: string) {
    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In production: Send SMS via Twilio/Fast2SMS
    this.logger.log(`OTP for ${phone}: ${otp}`);

    // Save OTP in database (with expiry)
    user.lastOtp = otp;
    user.lastOtpSentAt = new Date();
    await this.userRepository.save(user);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phone, otp } = verifyOtpDto;

    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check OTP expiry (5 minutes)
    const otpExpiryTime = 5 * 60 * 1000;
    if (
      !user.lastOtpSentAt ||
      Date.now() - user.lastOtpSentAt.getTime() > otpExpiryTime
    ) {
      throw new BadRequestException('OTP expired. Please request a new one.');
    }

    if (user.lastOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Mark phone as verified
    user.isPhoneVerified = true;
    user.lastOtp = null;
    user.lastOtpSentAt = null;
    await this.userRepository.save(user);

    // Generate token for auto-login after verification
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      email: user.email,
    };

    return {
      message: 'Phone verified successfully',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isPhoneVerified: true,
      },
    };
  }

  async refreshToken(user: any) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      email: user.email,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
