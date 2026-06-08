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
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const { phone, email, password, name, role } = registerDto;
        const existingUser = await this.userRepository.findOne({
            where: [{ phone }, { email }],
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this phone or email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            phone,
            email,
            name,
            password: hashedPassword,
            role: role || user_entity_1.UserRole.CUSTOMER,
            isPhoneVerified: false,
        });
        await this.userRepository.save(user);
        await this.sendOtp(phone);
        const { password: _, ...userWithoutPassword } = user;
        return {
            message: 'Registration successful. Please verify your phone number with OTP.',
            user: userWithoutPassword,
        };
    }
    async validateUser(phone, password) {
        const user = await this.userRepository.findOne({ where: { phone } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const { password: _, ...result } = user;
        return result;
    }
    async login(user) {
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
    async sendOtp(phone) {
        const user = await this.userRepository.findOne({ where: { phone } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.logger.log(`OTP for ${phone}: ${otp}`);
        user.lastOtp = otp;
        user.lastOtpSentAt = new Date();
        await this.userRepository.save(user);
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(verifyOtpDto) {
        const { phone, otp } = verifyOtpDto;
        const user = await this.userRepository.findOne({ where: { phone } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const otpExpiryTime = 5 * 60 * 1000;
        if (!user.lastOtpSentAt ||
            Date.now() - user.lastOtpSentAt.getTime() > otpExpiryTime) {
            throw new common_1.BadRequestException('OTP expired. Please request a new one.');
        }
        if (user.lastOtp !== otp) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        user.isPhoneVerified = true;
        user.lastOtp = null;
        user.lastOtpSentAt = null;
        await this.userRepository.save(user);
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
    async refreshToken(user) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map