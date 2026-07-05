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
exports.DailyOfferService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const daily_offer_entity_1 = require("../../core/entities/daily-offer.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const MAX_ACTIVE_OFFERS = 5;
const OFFER_DURATION_MS = 24 * 60 * 60 * 1000;
let DailyOfferService = class DailyOfferService {
    offerRepository;
    productRepository;
    shopRepository;
    constructor(offerRepository, productRepository, shopRepository) {
        this.offerRepository = offerRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
    }
    async getShop(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.NotFoundException('Shop not found');
        return shop;
    }
    async getActiveOffers(ownerId) {
        const shop = await this.getShop(ownerId);
        const now = new Date();
        return this.offerRepository.find({
            where: {
                shopId: shop.id,
                isActive: true,
                expiresAt: (0, typeorm_2.MoreThan)(now),
            },
            relations: ['product'],
            order: { createdAt: 'DESC' },
        });
    }
    async createOffer(ownerId, productId, offerPrice) {
        const shop = await this.getShop(ownerId);
        const activeCount = await this.offerRepository.count({
            where: {
                shopId: shop.id,
                isActive: true,
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (activeCount >= MAX_ACTIVE_OFFERS) {
            throw new common_1.BadRequestException(`Maximum ${MAX_ACTIVE_OFFERS} active offers allowed`);
        }
        const product = await this.productRepository.findOne({
            where: { id: productId, shopId: shop.id, status: product_entity_1.ProductStatus.APPROVED },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found or not approved');
        }
        if (offerPrice >= Number(product.price)) {
            throw new common_1.BadRequestException('Offer price must be less than product price');
        }
        const originalPrice = Number(product.price);
        const discountPercentage = Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
        const startsAt = new Date();
        const expiresAt = new Date(startsAt.getTime() + OFFER_DURATION_MS);
        const offer = this.offerRepository.create({
            shopId: shop.id,
            productId: product.id,
            offerPrice,
            originalPrice,
            discountPercentage,
            startsAt,
            expiresAt,
            isActive: true,
        });
        await this.offerRepository.save(offer);
        return this.offerRepository.findOne({
            where: { id: offer.id },
            relations: ['product'],
        });
    }
    async deleteOffer(ownerId, offerId) {
        const shop = await this.getShop(ownerId);
        const offer = await this.offerRepository.findOne({
            where: { id: offerId, shopId: shop.id },
        });
        if (!offer) {
            throw new common_1.NotFoundException('Offer not found');
        }
        offer.isActive = false;
        await this.offerRepository.save(offer);
        return { message: 'Offer removed successfully' };
    }
};
exports.DailyOfferService = DailyOfferService;
exports.DailyOfferService = DailyOfferService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(daily_offer_entity_1.DailyOffer)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DailyOfferService);
//# sourceMappingURL=daily-offer.service.js.map