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
exports.StaffWorkController = void 0;
const common_1 = require("@nestjs/common");
const staff_work_service_1 = require("./staff-work.service");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../core/guards/permissions.guard");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const create_product_dto_1 = require("../catalog/dto/create-product.dto");
const update_product_dto_1 = require("../catalog/dto/update-product.dto");
const search_query_dto_1 = require("../catalog/dto/search-query.dto");
const update_order_status_dto_1 = require("../orders/dto/update-order-status.dto");
const update_delivery_location_dto_1 = require("../orders/dto/update-delivery-location.dto");
let StaffWorkController = class StaffWorkController {
    staffWorkService;
    constructor(staffWorkService) {
        this.staffWorkService = staffWorkService;
    }
    getProfile(user) {
        return this.staffWorkService.getProfile(user);
    }
    getProducts(user, query) {
        return this.staffWorkService.getProducts(user, query);
    }
    createProduct(user, dto) {
        return this.staffWorkService.createProduct(user, dto);
    }
    updateProduct(user, id, dto) {
        return this.staffWorkService.updateProduct(user, id, dto);
    }
    getOrders(user, page, limit, status) {
        return this.staffWorkService.getOrders(user, parseInt(page || '1', 10), parseInt(limit || '20', 10), status);
    }
    updateOrderStatus(user, id, dto) {
        return this.staffWorkService.updateOrderStatus(user, id, dto);
    }
    updateDeliveryLocation(user, id, dto) {
        return this.staffWorkService.updateDeliveryLocation(user, id, dto);
    }
};
exports.StaffWorkController = StaffWorkController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffWorkController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('products'),
    (0, permissions_decorator_1.RequirePermissions)('products:read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, search_query_dto_1.SearchQueryDto]),
    __metadata("design:returntype", void 0)
], StaffWorkController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)('products'),
    (0, permissions_decorator_1.RequirePermissions)('products:write'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], StaffWorkController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)('products/:id'),
    (0, permissions_decorator_1.RequirePermissions)('products:write', 'inventory:write'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], StaffWorkController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permissions_decorator_1.RequirePermissions)('orders:read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], StaffWorkController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Put)('orders/:id/status'),
    (0, permissions_decorator_1.RequirePermissions)('orders:write'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_order_status_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], StaffWorkController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Put)('orders/:id/location'),
    (0, permissions_decorator_1.RequirePermissions)('orders:write'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_delivery_location_dto_1.UpdateDeliveryLocationDto]),
    __metadata("design:returntype", void 0)
], StaffWorkController.prototype, "updateDeliveryLocation", null);
exports.StaffWorkController = StaffWorkController = __decorate([
    (0, common_1.Controller)('staff/work'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [staff_work_service_1.StaffWorkService])
], StaffWorkController);
//# sourceMappingURL=staff-work.controller.js.map