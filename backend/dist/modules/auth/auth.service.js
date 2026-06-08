"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../../core/entities/user.entity");
const whatsapp_service_1 = require("../notifications/whatsapp.service");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    jwtService;
    whatsappService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepository, jwtService, whatsappService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.whatsappService = whatsappService;
    }
    normalizePhone(phone) {
        if (phone.startsWith('+91'))
            return phone;
        if (phone.startsWith('91') && phone.length === 12)
            return `+${phone}`;
        return `+91${phone}`;
    }
    async register(registerDto) {
        const { phone, email, password, name, role } = registerDto;
        const normalizedPhone = this.normalizePhone(phone);
        const existingUser = await this.userRepository.findOne({
            where: [{ phone: normalizedPhone }, ...(email ? [{ email }] : [])],
        });
        if (existingUser) {
            throw new common_1.BadRequestException('User with this phone or email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            name,
            phone: normalizedPhone,
            email: email || null,
            password: hashedPassword,
            role: role || user_entity_1.UserRole.CUSTOMER,
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
    async login(user) {
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
    async validateUser(phone, password) {
        const normalizedPhone = this.normalizePhone(phone);
        const user = await this.userRepository.findOne({
            where: [
                { phone: phone },
                { phone: normalizedPhone },
            ],
        });
        if (!user)
            return null;
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return null;
        return user;
    }
    async sendOtp(sendOtpDto) {
        const { phone } = sendOtpDto;
        const normalizedPhone = this.normalizePhone(phone);
        const user = await this.userRepository.findOne({
            where: { phone: normalizedPhone },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.logger.log(`OTP for ${normalizedPhone}: ${otp}`);
        await this.userRepository.query(`UPDATE users SET "lastOtp" = $1, "lastOtpSentAt" = $2 WHERE phone = $3`, [otp, new Date(), normalizedPhone]);
        const message = [
            `🔐 *LocalKart OTP Verification*`,
            ``,
            `Your OTP is: *${otp}*`,
            `Valid for 5 minutes. Do NOT share with anyone.`,
            ``,
            `🇮🇳 *తెలుగు:* మీ OTP: *${otp}* — ఎవరికీ చెప్పకండి.`,
            `🇮🇳 *हिंदी:* आपका OTP: *${otp}* — किसी को न बताएं।`,
        ].join('\n');
        await this.whatsappService['send'](normalizedPhone, message).catch((e) => this.logger.error('WhatsApp OTP failed: ' + e.message));
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(verifyOtpDto) {
        const { phone, otp } = verifyOtpDto;
        const normalizedPhone = this.normalizePhone(phone);
        const users = await this.userRepository.query(`SELECT * FROM users WHERE phone = $1`, [normalizedPhone]);
        if (!users || users.length === 0) {
            throw new common_1.BadRequestException('User not found');
        }
        const user = users[0];
        const otpExpiryTime = 5 * 60 * 1000;
        if (!user.lastOtpSentAt ||
            Date.now() - new Date(user.lastOtpSentAt).getTime() > otpExpiryTime) {
            throw new common_1.BadRequestException('OTP expired. Please request a new one.');
        }
        if (String(user.lastOtp).trim() !== String(otp).trim()) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        await this.userRepository.query(`UPDATE users SET "isPhoneVerified" = true, "lastOtp" = null, "lastOtpSentAt" = null WHERE phone = $1`, [normalizedPhone]);
        const userEntity = await this.userRepository.findOne({
            where: { phone: normalizedPhone },
        });
        if (!userEntity)
            throw new common_1.UnauthorizedException('User not found');
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
    async logout(userId) {
        return { message: 'Logged out successfully' };
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.userRepository.findOne({ where: { id: payload.sub } });
            if (!user)
                throw new common_1.UnauthorizedException('User not found');
            return this.generateTokens(user);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async generateTokens(user) {
        const payload = { sub: user.id, phone: user.phone, role: user.role };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        whatsapp_service_1.WhatsappService])
], AuthService);
//# sourceMappingURL=auth.service.js.map