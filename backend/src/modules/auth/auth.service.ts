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

  // ✅ Helper — phone ni always +91 format lo normalize chestundi
  private normalizePhone(phone: string): string {
    if (phone.startsWith('+91')) return phone;
    if (phone.startsWith('91') && phone.length === 12) return `+${phone}`;
    return `+91${phone}`;
  }

  async register(registerDto: RegisterDto) {
    const { phone, email, password, name, role } = registerDto;

    // ✅ Phone normalize chesi +91 format lo save cheyyandi
    const normalizedPhone = this.normalizePhone(phone);

    const existingUser = await this.userRepository.findOne({
      where: [{ phone: normalizedPhone }, ...(email ? [{ email }] : [])],
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with this phone or email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      phone: normalizedPhone, // ✅ Always +91 format
      email: email || null,
      password: hashedPassword,
      role: (role as UserRole) || UserRole.CUSTOMER,
      isPhoneVerified: true,
    });

    await this.userRepository.save(user);

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(user: User) {
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

  async validateUser(phone: string, password: string) {
    // ✅ Login lo kuda normalize — DB lo +91 format lo undi, so match avutundi
    const normalizedPhone = this.normalizePhone(phone);

    const user = await this.userRepository.findOne({
      where: [
        { phone: normalizedPhone },
        { phone: phone }, // fallback — old users kosam
      ],
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phone } = sendOtpDto;

    // ✅ OTP send lo kuda normalize
    const normalizedPhone = this.normalizePhone(phone);

    const user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    this.logger.log(`OTP for ${normalizedPhone}: ${otp}`);

    await this.userRepository.query(
      `UPDATE users
       SET "lastOtp" = $1,
           "lastOtpSentAt" = $2
       WHERE phone = $3`,
      [otp, new Date(), normalizedPhone],
    );

    return {
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phone, otp } = verifyOtpDto;

    // ✅ OTP verify lo kuda normalize
    const normalizedPhone = this.normalizePhone(phone);

    const users = await this.userRepository.query(
      `SELECT * FROM users WHERE phone = $1`,
      [normalizedPhone],
    );

    if (!users || users.length === 0) {
      throw new BadRequestException('User not found');
    }

    const user = users[0];

    const otpExpiryTime = 5 * 60 * 1000;

    if (
      !user.lastOtpSentAt ||
      Date.now() - new Date(user.lastOtpSentAt).getTime() > otpExpiryTime
    ) {
      throw new BadRequestException('OTP expired. Please request a new one.');
    }

    if (String(user.lastOtp).trim() !== String(otp).trim()) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.userRepository.query(
      `UPDATE users
       SET "isPhoneVerified" = true,
           "lastOtp" = null,
           "lastOtpSentAt" = null
       WHERE phone = $1`,
      [normalizedPhone],
    );

    const userEntity = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (!userEntity) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(userEntity);

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
    return {
      message: 'Logged out successfully',
    };
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

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
