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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const moderation_service_1 = require("./moderation.service");
const commission_service_1 = require("./commission.service");
const fraud_detection_service_1 = require("./fraud-detection.service");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const user_entity_1 = require("../../core/entities/user.entity");
let AdminController = class AdminController {
    adminService;
    moderationService;
    commissionService;
    fraudDetectionService;
    constructor(adminService, moderationService, commissionService, fraudDetectionService) {
        this.adminService = adminService;
        this.moderationService = moderationService;
        this.commissionService = commissionService;
        this.fraudDetectionService = fraudDetectionService;
    }
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }
    async getRevenueChart(period = 'month') {
        return this.adminService.getRevenueChart(period);
    }
    async getPendingShops(page, limit) {
        return this.moderationService.getPendingShops(parseInt(page || '1'), parseInt(limit || '20'));
    }
    async getAllShops(page, limit, status) {
        return this.moderationService.getAllShops(parseInt(page || '1'), parseInt(limit || '20'), status);
    }
    async approveShop(id) {
        return this.moderationService.approveShop(id);
    }
    async rejectShop(id, reason) {
        return this.moderationService.rejectShop(id, reason);
    }
    async suspendShop(id, reason) {
        return this.moderationService.suspendShop(id, reason);
    }
    async getPendingProducts(page, limit) {
        return this.moderationService.getPendingProducts(parseInt(page || '1'), parseInt(limit || '20'));
    }
    async approveProduct(id) {
        return this.moderationService.approveProduct(id);
    }
    async rejectProduct(id, reason) {
        return this.moderationService.rejectProduct(id, reason);
    }
    async getCommissionSummary(period) {
        return this.commissionService.getCommissionSummary(period);
    }
    async getCommissionTransactions(page, limit) {
        return this.commissionService.getCommissionTransactions(parseInt(page || '1'), parseInt(limit || '20'));
    }
    async updateCategoryCommission(categoryType, rate) {
        return this.commissionService.updateCategoryCommission(categoryType, rate);
    }
    async settleShopEarnings(shopId) {
        return this.commissionService.settleShopEarnings(shopId);
    }
    async getSuspiciousOrders() {
        return this.fraudDetectionService.getSuspiciousOrders();
    }
    async getUserActivity(userId) {
        return this.fraudDetectionService.getUserActivity(userId);
    }
    async blacklistUser(userId, reason) {
        return this.fraudDetectionService.blacklistUser(userId, reason);
    }
    async assessCodRisk(orderId) {
        return this.fraudDetectionService.assessCodRisk(orderId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('dashboard/revenue-chart'),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueChart", null);
__decorate([
    (0, common_1.Get)('shops/pending'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingShops", null);
__decorate([
    (0, common_1.Get)('shops'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllShops", null);
__decorate([
    (0, common_1.Put)('shops/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveShop", null);
__decorate([
    (0, common_1.Put)('shops/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectShop", null);
__decorate([
    (0, common_1.Put)('shops/:id/suspend'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "suspendShop", null);
__decorate([
    (0, common_1.Get)('products/pending'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingProducts", null);
__decorate([
    (0, common_1.Put)('products/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveProduct", null);
__decorate([
    (0, common_1.Put)('products/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectProduct", null);
__decorate([
    (0, common_1.Get)('commissions/summary'),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCommissionSummary", null);
__decorate([
    (0, common_1.Get)('commissions/transactions'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCommissionTransactions", null);
__decorate([
    (0, common_1.Put)('commissions/category/:categoryType'),
    __param(0, (0, common_1.Param)('categoryType')),
    __param(1, (0, common_1.Body)('rate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCategoryCommission", null);
__decorate([
    (0, common_1.Post)('commissions/settle/:shopId'),
    __param(0, (0, common_1.Param)('shopId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "settleShopEarnings", null);
__decorate([
    (0, common_1.Get)('fraud/suspicious-orders'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSuspiciousOrders", null);
__decorate([
    (0, common_1.Get)('fraud/user/:userId/activity'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserActivity", null);
__decorate([
    (0, common_1.Post)('fraud/blacklist/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "blacklistUser", null);
__decorate([
    (0, common_1.Get)('fraud/cod-risk/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assessCodRisk", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        moderation_service_1.ModerationService,
        commission_service_1.CommissionService,
        fraud_detection_service_1.FraudDetectionService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map