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
exports.CommissionController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const commission_service_1 = require("./commission.service");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const user_entity_1 = require("../../core/entities/user.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const payments_config_1 = require("./payments.config");
let CommissionController = class CommissionController {
    commissionService;
    shopRepository;
    constructor(commissionService, shopRepository) {
        this.commissionService = commissionService;
        this.shopRepository = shopRepository;
    }
    async resolveShopId(user) {
        if (user.shopId)
            return user.shopId;
        const shop = await this.shopRepository.findOne({ where: { ownerId: user.id } });
        if (!shop)
            throw new common_1.NotFoundException('Shop not found');
        return shop.id;
    }
    async getMyBills(req, page = '1', limit = '30') {
        const shopId = await this.resolveShopId(req.user);
        return this.commissionService.getShopBills(shopId, +page, +limit);
    }
    async initiatePayment(req, billId) {
        (0, payments_config_1.assertPaymentsEnabled)();
        const shopId = await this.resolveShopId(req.user);
        return this.commissionService.createCommissionPaymentOrder(shopId, billId);
    }
    async verifyPayment(req, billId, body) {
        (0, payments_config_1.assertPaymentsEnabled)();
        const shopId = await this.resolveShopId(req.user);
        return this.commissionService.verifyCommissionPayment(shopId, billId, body.razorpayPaymentId, body.razorpayOrderId, body.razorpaySignature);
    }
    async getOverdue() {
        return this.commissionService.getOverdueShops();
    }
    async generateToday() {
        await this.commissionService.generateDailyBills();
        return { success: true, message: 'Bills generated for today' };
    }
};
exports.CommissionController = CommissionController;
__decorate([
    (0, common_1.Get)('my-bills'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "getMyBills", null);
__decorate([
    (0, common_1.Post)('pay/:billId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('billId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.Post)('verify/:billId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('billId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Get)('admin/overdue'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "getOverdue", null);
__decorate([
    (0, common_1.Post)('admin/generate-today'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "generateToday", null);
exports.CommissionController = CommissionController = __decorate([
    (0, common_1.Controller)('commission'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [commission_service_1.CommissionService,
        typeorm_2.Repository])
], CommissionController);
//# sourceMappingURL=commission.controller.js.map