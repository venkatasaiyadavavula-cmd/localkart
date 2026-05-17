import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../core/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';

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

    const existingUser = await this.userRepository.findOne({
      where: [{ phone }, ...(email ? [{ email }] : [])],
    });

    if (existingUser) {
      throw new BadRequestException('User with this phone or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      phone,
      email: email || null,
      password: hashedPassword,
      role: role as UserRole || UserRole.CUSTOMER,
    });

    await this.userRepository.save(user);

    return {
      message: 'Registration successful. Please verify your phone number with OTP.',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { phone, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please login with OTP');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
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

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phone } = sendOtpDto;

    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.logger.log(`OTP for ${phone}: ${otp}`);

    await this.userRepository.update(
      { phone },
      {
        lastOtp: otp,
        lastOtpSentAt: new Date(),
      }
    );

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phone, otp } = verifyOtpDto;

    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otpExpiryTime = 5 * 60 * 1000;
    if (
      !user.lastOtpSentAt ||
      Date.now() - user.lastOtpSentAt.getTime() > otpExpiryTime
    ) {
      throw new BadRequestException('OTP expired. Please request a new one.');
    }

    if (String(user.lastOtp).trim() !== String(otp).trim()) {
      throw new BadRequestException('Invalid OTP');
    }

    user.isPhoneVerified = true;
    await this.userRepository.update(
      { phone },
      {
        isPhoneVerified: true,
        lastOtp: null,
        lastOtpSentAt: null,
      }
    );

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
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

  async logout(userId: string) {
    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return { accessToken, refreshToken };
  }
}
