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
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shop_entity_1 = require("../../core/entities/shop.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let ModerationService = class ModerationService {
    shopRepository;
    productRepository;
    notificationsService;
    constructor(shopRepository, productRepository, notificationsService) {
        this.shopRepository = shopRepository;
        this.productRepository = productRepository;
        this.notificationsService = notificationsService;
    }
    async getPendingShops(page, limit) {
        const skip = (page - 1) * limit;
        const [shops, total] = await this.shopRepository.findAndCount({
            where: { status: shop_entity_1.ShopStatus.PENDING },
            relations: ['owner'],
            order: { createdAt: 'ASC' },
            skip,
            take: limit,
        });
        shops.forEach(s => delete s.owner?.password);
        return {
            data: shops,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getAllShops(page, limit, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        const [shops, total] = await this.shopRepository.findAndCount({
            where,
            relations: ['owner'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        shops.forEach(s => delete s.owner?.password);
        return {
            data: shops,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async approveShop(id) {
        const shop = await this.shopRepository.findOne({
            where: { id },
            relations: ['owner'],
        });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        shop.status = shop_entity_1.ShopStatus.APPROVED;
        await this.shopRepository.save(shop);
        await this.notificationsService.sendSellerNotification(shop.ownerId, 'Shop Approved', 'Congratulations! Your shop has been approved and is now live on LocalKart.');
        return shop;
    }
    async rejectShop(id, reason) {
        const shop = await this.shopRepository.findOne({
            where: { id },
            relations: ['owner'],
        });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        shop.status = shop_entity_1.ShopStatus.REJECTED;
        await this.shopRepository.save(shop);
        await this.notificationsService.sendSellerNotification(shop.ownerId, 'Shop Rejected', `Your shop registration was rejected. Reason: ${reason}`);
        return shop;
    }
    async suspendShop(id, reason) {
        const shop = await this.shopRepository.findOne({
            where: { id },
            relations: ['owner'],
        });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        shop.status = shop_entity_1.ShopStatus.SUSPENDED;
        await this.shopRepository.save(shop);
        await this.notificationsService.sendSellerNotification(shop.ownerId, 'Shop Suspended', `Your shop has been suspended. Reason: ${reason}`);
        return shop;
    }
    async getPendingProducts(page, limit) {
        const skip = (page - 1) * limit;
        const [products, total] = await this.productRepository.findAndCount({
            where: { status: product_entity_1.ProductStatus.PENDING },
            relations: ['shop'],
            order: { createdAt: 'ASC' },
            skip,
            take: limit,
        });
        return {
            data: products,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async approveProduct(id) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['shop'],
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        product.status = product_entity_1.ProductStatus.APPROVED;
        await this.productRepository.save(product);
        await this.shopRepository.increment({ id: product.shopId }, 'totalProducts', 1);
        await this.notificationsService.sendSellerNotification(product.shop.ownerId, 'Product Approved', `Your product "${product.name}" has been approved.`);
        return product;
    }
    async rejectProduct(id, reason) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['shop'],
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        product.status = product_entity_1.ProductStatus.REJECTED;
        product.rejectionReason = reason;
        await this.productRepository.save(product);
        await this.notificationsService.sendSellerNotification(product.shop.ownerId, 'Product Rejected', `Your product "${product.name}" was rejected. Reason: ${reason}`);
        return product;
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map