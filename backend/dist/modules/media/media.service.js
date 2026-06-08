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
var MediaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const storage_config_1 = require("../../config/storage.config");
const shop_entity_1 = require("../../core/entities/shop.entity");
const product_entity_1 = require("../../core/entities/product.entity");
const subscription_entity_1 = require("../../core/entities/subscription.entity");
const VIDEO_PLAN_LIMITS = {
    [subscription_entity_1.SubscriptionPlan.STARTER]: 0,
    [subscription_entity_1.SubscriptionPlan.GROWTH]: 2,
    [subscription_entity_1.SubscriptionPlan.BUSINESS]: 5,
};
const VIDEO_CHARGE_PER_UPLOAD = 10;
let MediaService = MediaService_1 = class MediaService {
    mediaQueue;
    shopRepo;
    productRepo;
    subscriptionRepo;
    logger = new common_1.Logger(MediaService_1.name);
    constructor(mediaQueue, shopRepo, productRepo, subscriptionRepo) {
        this.mediaQueue = mediaQueue;
        this.shopRepo = shopRepo;
        this.productRepo = productRepo;
        this.subscriptionRepo = subscriptionRepo;
    }
    async uploadFile(userId, file, type) {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
        const folder = type === 'avatar' ? 'avatars' : 'uploads';
        const key = `${folder}/${userId}/${(0, uuid_1.v4)()}.${extension}`;
        const uploadUrl = await (0, storage_config_1.getSignedUploadUrl)(key, file.mimetype);
        return {
            uploadUrl,
            key,
            publicUrl: `https://${storage_config_1.BUCKET_NAME}.s3.amazonaws.com/${key}`,
            fileType: file.mimetype,
        };
    }
    async uploadVideo(userId, file) {
        if (!file)
            throw new common_1.BadRequestException('No video file provided');
        const shop = await this.shopRepo.findOne({
            where: { ownerId: userId },
        });
        if (!shop) {
            throw new common_1.ForbiddenException('Only sellers with a shop can upload videos');
        }
        const subscription = await this.subscriptionRepo.findOne({
            where: {
                shopId: shop.id,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                endDate: (0, typeorm_2.MoreThanOrEqual)(new Date()),
            },
            order: { createdAt: 'DESC' },
        });
        const plan = subscription?.plan || subscription_entity_1.SubscriptionPlan.STARTER;
        const freeLimit = VIDEO_PLAN_LIMITS[plan];
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlyVideoCount = await this.productRepo
            .createQueryBuilder('p')
            .where('p.shopId = :shopId', { shopId: shop.id })
            .andWhere('p.updatedAt >= :startOfMonth', { startOfMonth })
            .andWhere("array_length(p.videos, 1) > 0")
            .getCount();
        const isWithinFreeLimit = monthlyVideoCount < freeLimit;
        const chargeAmount = isWithinFreeLimit ? 0 : VIDEO_CHARGE_PER_UPLOAD;
        this.logger.log(`Video upload: shopId=${shop.id}, plan=${plan}, ` +
            `monthlyCount=${monthlyVideoCount}, freeLimit=${freeLimit}, ` +
            `charge=₹${chargeAmount}`);
        const extension = file.originalname.split('.').pop()?.toLowerCase() || 'mp4';
        const key = `videos/${shop.id}/${(0, uuid_1.v4)()}.${extension}`;
        const uploadUrl = await (0, storage_config_1.getSignedUploadUrl)(key, file.mimetype);
        const job = await this.mediaQueue.add('transcode', {
            userId,
            shopId: shop.id,
            key,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            chargeAmount,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
        return {
            uploadUrl,
            key,
            jobId: job.id,
            status: 'pending',
            message: 'Video uploaded. Transcoding in progress.',
            publicUrl: `https://${storage_config_1.BUCKET_NAME}.s3.amazonaws.com/${key}`,
            chargeAmount,
            plan,
            monthlyCount: monthlyVideoCount + 1,
            freeLimit,
            isWithinFreeLimit,
            chargeMessage: isWithinFreeLimit
                ? `✅ Free video (${monthlyVideoCount + 1}/${freeLimit} this month)`
                : `💳 ₹${VIDEO_CHARGE_PER_UPLOAD} will be charged for this video upload`,
        };
    }
    async getVideoStatus(jobId) {
        const job = await this.mediaQueue.getJob(jobId);
        if (!job)
            throw new common_1.BadRequestException('Job not found');
        const state = await job.getState();
        const progress = job.progress();
        const result = state === 'completed' ? job.returnvalue : null;
        return { jobId, state, progress, result };
    }
    async getVideoStats(userId) {
        const shop = await this.shopRepo.findOne({ where: { ownerId: userId } });
        if (!shop)
            throw new common_1.ForbiddenException('No shop found');
        const subscription = await this.subscriptionRepo.findOne({
            where: {
                shopId: shop.id,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                endDate: (0, typeorm_2.MoreThanOrEqual)(new Date()),
            },
            order: { createdAt: 'DESC' },
        });
        const plan = subscription?.plan || subscription_entity_1.SubscriptionPlan.STARTER;
        const freeLimit = VIDEO_PLAN_LIMITS[plan];
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlyCount = await this.productRepo
            .createQueryBuilder('p')
            .where('p.shopId = :shopId', { shopId: shop.id })
            .andWhere('p.updatedAt >= :startOfMonth', { startOfMonth })
            .andWhere("array_length(p.videos, 1) > 0")
            .getCount();
        const totalVideos = await this.productRepo
            .createQueryBuilder('p')
            .where('p.shopId = :shopId', { shopId: shop.id })
            .andWhere("array_length(p.videos, 1) > 0")
            .getCount();
        return {
            plan,
            freeLimit,
            monthlyCount,
            remaining: Math.max(0, freeLimit - monthlyCount),
            totalVideos,
            chargePerVideo: VIDEO_CHARGE_PER_UPLOAD,
            nextVideoIsFree: monthlyCount < freeLimit,
            nextVideoCharge: monthlyCount >= freeLimit ? VIDEO_CHARGE_PER_UPLOAD : 0,
        };
    }
    async getSignedUrl(key) {
        return { url: await (0, storage_config_1.getSignedViewUrl)(key) };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = MediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('media')),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __metadata("design:paramtypes", [Object, typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MediaService);
//# sourceMappingURL=media.service.js.map