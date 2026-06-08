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
exports.AdCampaignService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sponsored_product_entity_1 = require("../../core/entities/sponsored-product.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
let AdCampaignService = class AdCampaignService {
    adRepository;
    productRepository;
    shopRepository;
    constructor(adRepository, productRepository, shopRepository) {
        this.adRepository = adRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
    }
    async getCampaigns(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        return this.adRepository.find({
            where: { shopId: shop.id },
            relations: ['product'],
            order: { createdAt: 'DESC' },
        });
    }
    async createCampaign(ownerId, dto) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const product = await this.productRepository.findOne({
            where: { id: dto.productId, shopId: shop.id, status: product_entity_1.ProductStatus.APPROVED },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found or not approved');
        }
        const existing = await this.adRepository.findOne({
            where: { productId: dto.productId, status: sponsored_product_entity_1.AdStatus.ACTIVE },
        });
        if (existing) {
            throw new common_1.BadRequestException('Product already has an active ad campaign');
        }
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const costPerDay = dto.adType === sponsored_product_entity_1.AdType.SPONSORED ? 100 : 10;
        const totalCost = days * costPerDay;
        const campaign = this.adRepository.create({
            productId: dto.productId,
            shopId: shop.id,
            adType: dto.adType || sponsored_product_entity_1.AdType.SPONSORED,
            status: sponsored_product_entity_1.AdStatus.PENDING,
            costPerDay,
            startDate,
            endDate,
            totalCost,
            targeting: dto.targeting,
        });
        await this.adRepository.save(campaign);
        if (startDate <= new Date()) {
            campaign.status = sponsored_product_entity_1.AdStatus.ACTIVE;
            product.isSponsored = true;
            product.sponsoredUntil = endDate;
            await Promise.all([
                this.adRepository.save(campaign),
                this.productRepository.save(product),
            ]);
        }
        return campaign;
    }
    async updateCampaign(ownerId, id, dto) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const campaign = await this.adRepository.findOne({
            where: { id, shopId: shop.id },
            relations: ['product'],
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        if (dto.status) {
            campaign.status = dto.status;
            if (dto.status === sponsored_product_entity_1.AdStatus.ACTIVE) {
                campaign.product.isSponsored = true;
                campaign.product.sponsoredUntil = campaign.endDate;
                await this.productRepository.save(campaign.product);
            }
            else if (dto.status === sponsored_product_entity_1.AdStatus.PAUSED || dto.status === sponsored_product_entity_1.AdStatus.EXPIRED) {
                campaign.product.isSponsored = false;
                campaign.product.sponsoredUntil = null;
                await this.productRepository.save(campaign.product);
            }
        }
        Object.assign(campaign, dto);
        await this.adRepository.save(campaign);
        return campaign;
    }
    async pauseCampaign(ownerId, id) {
        return this.updateCampaign(ownerId, id, { status: sponsored_product_entity_1.AdStatus.PAUSED });
    }
    async resumeCampaign(ownerId, id) {
        return this.updateCampaign(ownerId, id, { status: sponsored_product_entity_1.AdStatus.ACTIVE });
    }
    async getCampaignStats(ownerId, id) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const campaign = await this.adRepository.findOne({
            where: { id, shopId: shop.id },
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        return {
            impressions: campaign.impressions,
            clicks: campaign.clicks,
            ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
            spent: campaign.totalCost,
            status: campaign.status,
            remainingDays: Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        };
    }
};
exports.AdCampaignService = AdCampaignService;
exports.AdCampaignService = AdCampaignService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sponsored_product_entity_1.SponsoredProduct)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdCampaignService);
//# sourceMappingURL=ad-campaign.service.js.map