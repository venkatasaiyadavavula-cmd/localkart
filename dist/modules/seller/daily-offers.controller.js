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
exports.DailyOffersController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const daily_offer_entity_1 = require("../../core/entities/daily-offer.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const user_entity_1 = require("../../core/entities/user.entity");
const common_2 = require("@nestjs/common");
let DailyOffersController = class DailyOffersController {
    offerRepository;
    productRepository;
    shopRepository;
    constructor(offerRepository, productRepository, shopRepository) {
        this.offerRepository = offerRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
    }
    async getMyOffers(user) {
        const shop = await this.shopRepository.findOne({ where: { ownerId: user.id } });
        if (!shop)
            throw new common_2.BadRequestException('Shop not found');
        const now = new Date();
        return this.offerRepository.find({
            where: { shopId: shop.id, isActive: true, expiresAt: MoreThan(now) },
            relations: ['product'],
            order: { createdAt: 'DESC' },
        });
    }
    async createOffer(user, body) {
        const shop = await this.shopRepository.findOne({ where: { ownerId: user.id } });
        if (!shop)
            throw new common_2.BadRequestException('Shop not found');
        const now = new Date();
        const activeOffers = await this.offerRepository.count({
            where: { shopId: shop.id, isActive: true, expiresAt: MoreThan(now) },
        });
        if (activeOffers >= 5) {
            throw new common_2.BadRequestException('You can only have 5 active offers at a time');
        }
        const existingOffer = await this.offerRepository.findOne({
            where: { productId: body.productId, isActive: true, expiresAt: MoreThan(now) },
        });
        if (existingOffer) {
            throw new common_2.BadRequestException('This product already has an active offer');
        }
        const product = await this.productRepository.findOne({
            where: { id: body.productId, shopId: shop.id },
        });
        if (!product)
            throw new common_2.BadRequestException('Product not found');
        if (body.offerPrice >= product.price) {
            throw new common_2.BadRequestException('Offer price must be less than original price');
        }
        const discountPercentage = Math.round(((product.price - body.offerPrice) / product.price) * 100);
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const offer = this.offerRepository.create({
            shopId: shop.id,
            productId: product.id,
            offerPrice: body.offerPrice,
            originalPrice: product.price,
            discountPercentage,
            startsAt: now,
            expiresAt,
        });
        return this.offerRepository.save(offer);
    }
    async deleteOffer(user, id) {
        const shop = await this.shopRepository.findOne({ where: { ownerId: user.id } });
        if (!shop)
            throw new common_2.BadRequestException('Shop not found');
        await this.offerRepository.update({ id, shopId: shop.id }, { isActive: false });
        return { message: 'Offer removed' };
    }
};
exports.DailyOffersController = DailyOffersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DailyOffersController.prototype, "getMyOffers", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DailyOffersController.prototype, "createOffer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DailyOffersController.prototype, "deleteOffer", null);
exports.DailyOffersController = DailyOffersController = __decorate([
    (0, common_1.Controller)('seller/daily-offers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, typeorm_1.InjectRepository)(daily_offer_entity_1.DailyOffer)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DailyOffersController);
//# sourceMappingURL=daily-offers.controller.js.map