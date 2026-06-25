import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from '../../core/entities/user.entity';
import { SmsService } from '../notifications/sms.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let smsService: SmsService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockSmsService = {
    sendOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    smsService = module.get<SmsService>(SmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        phone: '+919876543210',
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(registerDto);
      mockUserRepository.save.mockResolvedValue({
        ...registerDto,
        id: '123',
        password: 'hashedPassword',
      });
      mockSmsService.sendOtp.mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.register(registerDto);

      expect(result.message).toContain('Registration successful');
      expect(result.user).not.toHaveProperty('password');
      expect(mockSmsService.sendOtp).toHaveBeenCalledWith(registerDto.phone);
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        phone: '+919876543210',
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: '123' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        password: 'hashedPassword',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('+919876543210', 'Password123');

      expect(result).not.toHaveProperty('password');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { phone: '+919876543210' },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser('+919876543210', 'Password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        password: 'hashedPassword',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.validateUser('+919876543210', 'WrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is deactivated', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        password: 'hashedPassword',
        isActive: false,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.validateUser('+919876543210', 'Password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
        name: 'Test User',
      };

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(user);

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
      });
    });
  });

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        lastOtp: null,
        lastOtpSentAt: null,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);
      mockSmsService.sendOtp.mockResolvedValue(true);

      const result = await service.sendOtp('+919876543210');

      expect(result.message).toBe('OTP sent successfully');
      expect(mockSmsService.sendOtp).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.sendOtp('+919876543210')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
        lastOtp: '123456',
        lastOtpSentAt: new Date(),
        isPhoneVerified: false,
      };

      const verifyOtpDto = {
        phone: '+919876543210',
        otp: '123456',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.verifyOtp(verifyOtpDto);

      expect(result.message).toBe('Phone verified successfully');
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.isPhoneVerified).toBe(true);
    });

    it('should throw BadRequestException if OTP expired', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        lastOtp: '123456',
        lastOtpSentAt: new Date(Date.now() - 6 * 60 * 1000), // 6 minutes ago
      };

      const verifyOtpDto = {
        phone: '+919876543210',
        otp: '123456',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.verifyOtp(verifyOtpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP is invalid', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        lastOtp: '123456',
        lastOtpSentAt: new Date(),
      };

      const verifyOtpDto = {
        phone: '+919876543210',
        otp: '000000',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.verifyOtp(verifyOtpDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const user = {
        id: '123',
        phone: '+919876543210',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      mockJwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.refreshToken(user);

      expect(result.accessToken).toBe('new-jwt-token');
    });
  });
});
