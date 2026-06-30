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
var StaffService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const staff_member_entity_1 = require("../../core/entities/staff-member.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const MAX_STAFF = 10;
const ROLE_PERMISSIONS = {
    [staff_member_entity_1.StaffRole.STORE_MANAGER]: ['products:read', 'products:write', 'orders:read', 'orders:write', 'inventory:write'],
    [staff_member_entity_1.StaffRole.PRODUCTS_MANAGER]: ['products:read', 'products:write', 'inventory:write'],
    [staff_member_entity_1.StaffRole.DELIVERY_STAFF]: ['orders:read', 'orders:write'],
};
let StaffService = StaffService_1 = class StaffService {
    staffRepo;
    shopRepo;
    jwtService;
    logger = new common_1.Logger(StaffService_1.name);
    constructor(staffRepo, shopRepo, jwtService) {
        this.staffRepo = staffRepo;
        this.shopRepo = shopRepo;
        this.jwtService = jwtService;
    }
    async getStaff(ownerId) {
        const shop = await this.shopRepo.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.ForbiddenException('Shop not found');
        const staff = await this.staffRepo.find({
            where: { shopId: shop.id },
            order: { createdAt: 'DESC' },
            select: ['id', 'name', 'phone', 'staffId', 'role', 'status', 'lastLoginAt', 'note', 'createdAt'],
        });
        return staff.map(s => ({
            ...s,
            permissions: ROLE_PERMISSIONS[s.role],
            isOnline: s.lastLoginAt
                ? (Date.now() - new Date(s.lastLoginAt).getTime()) < 30 * 60 * 1000
                : false,
        }));
    }
    async addStaff(ownerId, dto) {
        const shop = await this.shopRepo.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.ForbiddenException('Shop not found');
        const count = await this.staffRepo.count({ where: { shopId: shop.id, status: staff_member_entity_1.StaffStatus.ACTIVE } });
        if (count >= MAX_STAFF)
            throw new common_1.BadRequestException(`Maximum ${MAX_STAFF} staff members allowed`);
        const existing = await this.staffRepo.findOne({ where: { phone: dto.phone } });
        if (existing)
            throw new common_1.ConflictException('Phone number already used');
        const shopCode = shop.name.substring(0, 3).toUpperCase();
        const suffix = Math.floor(1000 + Math.random() * 9000);
        const staffId = `LK-${shopCode}-${suffix}`;
        const tempPassword = `${dto.name.substring(0, 3).toLowerCase()}${dto.phone.slice(-4)}`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const staff = this.staffRepo.create({
            shopId: shop.id,
            name: dto.name,
            phone: dto.phone,
            role: dto.role,
            staffId,
            passwordHash,
            note: dto.note,
            status: staff_member_entity_1.StaffStatus.ACTIVE,
        });
        await this.staffRepo.save(staff);
        this.logger.log(`Staff added: ${staffId} (${dto.role}) to shop ${shop.name}`);
        return {
            id: staff.id,
            name: staff.name,
            phone: staff.phone,
            staffId: staff.staffId,
            role: staff.role,
            permissions: ROLE_PERMISSIONS[staff.role],
            tempPassword,
            message: 'Share these credentials with the staff member. They should change their password on first login.',
        };
    }
    async updateStaff(ownerId, staffMemberId, dto) {
        const shop = await this.shopRepo.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.ForbiddenException('Shop not found');
        const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        if (dto.role)
            staff.role = dto.role;
        if (dto.note !== undefined)
            staff.note = dto.note;
        await this.staffRepo.save(staff);
        return {
            ...staff,
            permissions: ROLE_PERMISSIONS[staff.role],
        };
    }
    async removeStaff(ownerId, staffMemberId) {
        const shop = await this.shopRepo.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.ForbiddenException('Shop not found');
        const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        staff.status = staff_member_entity_1.StaffStatus.INACTIVE;
        await this.staffRepo.save(staff);
        this.logger.log(`Staff deactivated: ${staff.staffId} from shop ${shop.name}`);
        return { success: true, message: `${staff.name}'s access has been removed immediately.` };
    }
    async resetPassword(ownerId, staffMemberId) {
        const shop = await this.shopRepo.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.ForbiddenException('Shop not found');
        const staff = await this.staffRepo.findOne({ where: { id: staffMemberId, shopId: shop.id } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        const newPassword = `${staff.name.substring(0, 3).toLowerCase()}${Date.now().toString().slice(-4)}`;
        staff.passwordHash = await bcrypt.hash(newPassword, 10);
        await this.staffRepo.save(staff);
        return { success: true, staffId: staff.staffId, newPassword, message: 'Password reset. Share with staff member.' };
    }
    async staffLogin(staffId, password) {
        const staff = await this.staffRepo.findOne({
            where: { staffId, status: staff_member_entity_1.StaffStatus.ACTIVE },
            relations: ['shop'],
        });
        if (!staff)
            throw new UnauthorizedException('Invalid Staff ID or account inactive');
        const valid = await bcrypt.compare(password, staff.passwordHash);
        if (!valid)
            throw new UnauthorizedException('Invalid password');
        staff.lastLoginAt = new Date();
        await this.staffRepo.save(staff);
        const token = this.jwtService.sign({
            sub: staff.id,
            staffId: staff.staffId,
            shopId: staff.shopId,
            role: 'staff',
            staffRole: staff.role,
            permissions: ROLE_PERMISSIONS[staff.role],
        });
        return {
            token,
            staff: {
                id: staff.id,
                name: staff.name,
                staffId: staff.staffId,
                role: staff.role,
                shopName: staff.shop.name,
                permissions: ROLE_PERMISSIONS[staff.role],
            },
        };
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = StaffService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(staff_member_entity_1.StaffMember)),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], StaffService);
class UnauthorizedException extends Error {
    constructor(msg) { super(msg); this.name = 'UnauthorizedException'; }
}
//# sourceMappingURL=staff.service.js.map