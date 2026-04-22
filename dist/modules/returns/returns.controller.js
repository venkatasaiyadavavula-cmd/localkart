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
exports.ReturnsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const returns_service_1 = require("./returns.service");
const return_request_dto_1 = require("./dto/return-request.dto");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const user_entity_1 = require("../../core/entities/user.entity");
let ReturnsController = class ReturnsController {
    returnsService;
    constructor(returnsService) {
        this.returnsService = returnsService;
    }
    async createReturnRequest(user, dto, files) {
        return this.returnsService.createReturnRequest(user.id, dto, files);
    }
    async getMyReturnRequests(user, page, limit) {
        return this.returnsService.getUserReturnRequests(user.id, parseInt(page || '1'), parseInt(limit || '20'));
    }
    async getReturnRequestById(user, id) {
        return this.returnsService.getReturnRequestById(id, user.id, user.role);
    }
    async cancelReturnRequest(user, id) {
        return this.returnsService.cancelReturnRequest(id, user.id);
    }
    async getSellerPendingReturns(user) {
        return this.returnsService.getSellerPendingReturns(user.id);
    }
    async approveReturnRequest(user, id) {
        return this.returnsService.approveReturnRequest(id, user.id);
    }
    async rejectReturnRequest(user, id, reason) {
        return this.returnsService.rejectReturnRequest(id, user.id, reason);
    }
    async schedulePickup(user, id, body) {
        return this.returnsService.schedulePickup(id, user.id, body);
    }
    async confirmPickup(user, id) {
        return this.returnsService.confirmPickup(id, user.id);
    }
    async getAllReturnRequests(page, limit, status) {
        return this.returnsService.getAllReturnRequests(parseInt(page || '1'), parseInt(limit || '20'), status);
    }
    async adminUpdateReturnStatus(id, dto) {
        return this.returnsService.adminUpdateReturnStatus(id, dto);
    }
    async processRefund(id) {
        return this.returnsService.processRefund(id);
    }
};
exports.ReturnsController = ReturnsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.CUSTOMER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('evidence', 5)),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, return_request_dto_1.CreateReturnRequestDto, Array]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "createReturnRequest", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "getMyReturnRequests", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "getReturnRequestById", null);
__decorate([
    (0, common_1.Put)(':id/cancel'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.CUSTOMER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "cancelReturnRequest", null);
__decorate([
    (0, common_1.Get)('seller/pending'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "getSellerPendingReturns", null);
__decorate([
    (0, common_1.Put)('seller/:id/approve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "approveReturnRequest", null);
__decorate([
    (0, common_1.Put)('seller/:id/reject'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "rejectReturnRequest", null);
__decorate([
    (0, common_1.Put)('seller/:id/schedule-pickup'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "schedulePickup", null);
__decorate([
    (0, common_1.Put)('seller/:id/confirm-pickup'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "confirmPickup", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "getAllReturnRequests", null);
__decorate([
    (0, common_1.Put)('admin/:id/status'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, return_request_dto_1.UpdateReturnStatusDto]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "adminUpdateReturnStatus", null);
__decorate([
    (0, common_1.Post)('admin/:id/process-refund'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "processRefund", null);
exports.ReturnsController = ReturnsController = __decorate([
    (0, common_1.Controller)('returns'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [returns_service_1.ReturnsService])
], ReturnsController);
//# sourceMappingURL=returns.controller.js.map