"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../../core/entities/user.entity");
const staff_member_entity_1 = require("../../../core/entities/staff-member.entity");
const staff_permissions_1 = require("../../seller/staff-permissions");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    userRepository;
    staffRepository;
    constructor(configService, userRepository, staffRepository) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.configService = configService;
        this.userRepository = userRepository;
        this.staffRepository = staffRepository;
    }
    async validate(payload) {
        if (payload.role === 'staff') {
            const staff = await this.staffRepository.findOne({
                where: { id: payload.sub, status: staff_member_entity_1.StaffStatus.ACTIVE },
                relations: ['shop'],
            });
            if (!staff) {
                throw new common_1.UnauthorizedException('Staff account not found or inactive');
            }
            return {
                id: staff.id,
                role: 'staff',
                staffRole: staff.role,
                staffId: staff.staffId,
                shopId: staff.shopId,
                shopName: staff.shop?.name,
                name: staff.name,
                permissions: staff_permissions_1.ROLE_PERMISSIONS[staff.role] ?? payload.permissions ?? [],
            };
        }
        const user = await this.userRepository.findOne({
            where: { id: payload.sub, isActive: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        return {
            id: user.id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            name: user.name,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(staff_member_entity_1.StaffMember)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map