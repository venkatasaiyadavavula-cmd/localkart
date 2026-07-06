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
exports.StaffWorkService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shop_entity_1 = require("../../core/entities/shop.entity");
const catalog_service_1 = require("../catalog/catalog.service");
const orders_service_1 = require("../orders/orders.service");
let StaffWorkService = class StaffWorkService {
    shopRepo;
    catalogService;
    ordersService;
    constructor(shopRepo, catalogService, ordersService) {
        this.shopRepo = shopRepo;
        this.catalogService = catalogService;
        this.ordersService = ordersService;
    }
    async resolveOwnerId(shopId) {
        const shop = await this.shopRepo.findOne({ where: { id: shopId } });
        if (!shop)
            throw new common_1.NotFoundException('Shop not found');
        return shop.ownerId;
    }
    async getProfile(staffUser) {
        const shop = await this.shopRepo.findOne({ where: { id: staffUser.shopId } });
        return {
            id: staffUser.id,
            name: staffUser.name,
            staffId: staffUser.staffId,
            staffRole: staffUser.staffRole,
            shopId: staffUser.shopId,
            shopName: shop?.name ?? staffUser.shopName,
            permissions: staffUser.permissions,
        };
    }
    async getProducts(staffUser, query) {
        const ownerId = await this.resolveOwnerId(staffUser.shopId);
        return this.catalogService.getSellerProducts(ownerId, query);
    }
    async createProduct(staffUser, dto) {
        const ownerId = await this.resolveOwnerId(staffUser.shopId);
        return this.catalogService.createProduct(ownerId, dto);
    }
    async updateProduct(staffUser, productId, dto) {
        const ownerId = await this.resolveOwnerId(staffUser.shopId);
        return this.catalogService.updateProduct(ownerId, productId, dto);
    }
    async getOrders(staffUser, page = 1, limit = 20, status) {
        const ownerId = await this.resolveOwnerId(staffUser.shopId);
        return this.ordersService.getSellerOrders(ownerId, page, limit, status);
    }
    async updateOrderStatus(staffUser, orderId, dto) {
        const ownerId = await this.resolveOwnerId(staffUser.shopId);
        return this.ordersService.updateOrderStatusBySeller(orderId, ownerId, dto);
    }
    async updateDeliveryLocation(staffUser, orderId, dto) {
        const ownerId = await this.resolveOwnerId(staffUser.shopId);
        return this.ordersService.updateDeliveryLocation(orderId, ownerId, dto);
    }
};
exports.StaffWorkService = StaffWorkService;
exports.StaffWorkService = StaffWorkService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => catalog_service_1.CatalogService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        catalog_service_1.CatalogService,
        orders_service_1.OrdersService])
], StaffWorkService);
//# sourceMappingURL=staff-work.service.js.map