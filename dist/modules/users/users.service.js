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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../../core/entities/user.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
let UsersService = class UsersService {
    userRepository;
    shopRepository;
    constructor(userRepository, shopRepository) {
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['shop'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { password, lastOtp, ...userProfile } = user;
        return userProfile;
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateProfileDto.email && updateProfileDto.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: updateProfileDto.email },
            });
            if (existingUser) {
                throw new common_1.BadRequestException('Email already in use');
            }
        }
        if (updateProfileDto.password) {
            if (!updateProfileDto.currentPassword) {
                throw new common_1.BadRequestException('Current password is required to change password');
            }
            const isPasswordValid = await bcrypt.compare(updateProfileDto.currentPassword, user.password);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Current password is incorrect');
            }
            user.password = await bcrypt.hash(updateProfileDto.password, 10);
        }
        if (updateProfileDto.name)
            user.name = updateProfileDto.name;
        if (updateProfileDto.email)
            user.email = updateProfileDto.email;
        if (updateProfileDto.address)
            user.address = updateProfileDto.address;
        if (updateProfileDto.latitude)
            user.latitude = updateProfileDto.latitude;
        if (updateProfileDto.longitude)
            user.longitude = updateProfileDto.longitude;
        if (updateProfileDto.profileImage)
            user.profileImage = updateProfileDto.profileImage;
        await this.userRepository.save(user);
        const { password, lastOtp, ...updatedProfile } = user;
        return updatedProfile;
    }
    async getUserById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['shop'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { password, lastOtp, ...userData } = user;
        return userData;
    }
    async deactivateUser(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isActive = false;
        await this.userRepository.save(user);
        return { message: 'User deactivated successfully' };
    }
    async activateUser(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isActive = true;
        await this.userRepository.save(user);
        return { message: 'User activated successfully' };
    }
    async getShopByOwnerId(ownerId) {
        const shop = await this.shopRepository.findOne({
            where: { ownerId },
        });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found for this user');
        }
        return shop;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map