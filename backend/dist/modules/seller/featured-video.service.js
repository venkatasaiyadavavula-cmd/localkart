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
var FeaturedVideoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedVideoService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const featured_video_entity_1 = require("../../core/entities/featured-video.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
const ad_packages_1 = require("./ad-packages");
let FeaturedVideoService = FeaturedVideoService_1 = class FeaturedVideoService {
    featuredRepo;
    productRepo;
    shopRepo;
    logger = new common_1.Logger(FeaturedVideoService_1.name);
    constructor(featuredRepo, productRepo, shopRepo) {
        this.featuredRepo = featuredRepo;
        this.productRepo = productRepo;
        this.shopRepo = shopRepo;
    }
    async expireOldFeaturedVideos() {
        const now = new Date();
        const result = await this.featuredRepo.update({ status: featured_video_entity_1.FeaturedVideoStatus.ACTIVE, expiresAt: (0, typeorm_2.LessThan)(now) }, { status: featured_video_entity_1.FeaturedVideoStatus.EXPIRED });
        if (result.affected) {
            this.logger.log(`Expired ${result.affected} featured videos`);
        }
    }
    async promoteVideo(ownerId, productId) {
        const shop = await this.shopRepo.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.ForbiddenException('Shop not found');
        const product = await this.productRepo.findOne({
            where: { id: productId, shopId: shop.id, status: product_entity_1.ProductStatus.APPROVED },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found or not approved');
        const videoUrl = product.videos?.[0];
        if (!videoUrl)
            throw new common_1.BadRequestException('Product has no video. Upload a video first (₹10).');
        const existing = await this.featuredRepo.findOne({
            where: { productId, status: featured_video_entity_1.FeaturedVideoStatus.ACTIVE },
        });
        if (existing && existing.expiresAt > new Date()) {
            throw new common_1.BadRequestException('This video is already featured on homepage. Wait until it expires.');
        }
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + ad_packages_1.FEATURED_VIDEO_HOURS);
        const featured = this.featuredRepo.create({
            shopId: shop.id,
            productId: product.id,
            videoUrl,
            amount: ad_packages_1.FEATURED_VIDEO_PRICE,
            status: featured_video_entity_1.FeaturedVideoStatus.ACTIVE,
            expiresAt,
        });
        await this.featuredRepo.save(featured);
        return {
            ...featured,
            message: `Video featured on homepage for 24 hours. Charged ₹${ad_packages_1.FEATURED_VIDEO_PRICE}.`,
            hoursRemaining: ad_packages_1.FEATURED_VIDEO_HOURS,
        };
    }
    async getSellerFeaturedVideos(ownerId) {
        const shop = await this.shopRepo.findOne({ where: { ownerId } });
        if (!shop)
            throw new common_1.ForbiddenException('Shop not found');
        return this.featuredRepo.find({
            where: { shopId: shop.id },
            relations: ['product'],
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }
    async getActiveFeaturedVideos(limit = 12) {
        await this.expireOldFeaturedVideos();
        return this.featuredRepo.find({
            where: {
                status: featured_video_entity_1.FeaturedVideoStatus.ACTIVE,
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
            relations: ['product', 'shop', 'product.shop'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
};
exports.FeaturedVideoService = FeaturedVideoService;
__decorate([
    (0, schedule_1.Cron)('0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeaturedVideoService.prototype, "expireOldFeaturedVideos", null);
exports.FeaturedVideoService = FeaturedVideoService = FeaturedVideoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(featured_video_entity_1.FeaturedVideo)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FeaturedVideoService);
//# sourceMappingURL=featured-video.service.js.map