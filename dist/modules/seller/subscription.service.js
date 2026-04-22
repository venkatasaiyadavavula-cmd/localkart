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
exports.SubscriptionService = exports.SUBSCRIPTION_PLANS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_entity_1 = require("../../core/entities/subscription.entity");
const shop_entity_1 = require("../../core/entities/shop.entity");
exports.SUBSCRIPTION_PLANS = [
    { plan: subscription_entity_1.SubscriptionPlan.STARTER, productLimit: 30, price: 0 },
    { plan: subscription_entity_1.SubscriptionPlan.GROWTH, productLimit: 60, price: 199 },
    { plan: subscription_entity_1.SubscriptionPlan.BUSINESS, productLimit: 100, price: 499 },
];
let SubscriptionService = class SubscriptionService {
    subscriptionRepository;
    shopRepository;
    constructor(subscriptionRepository, shopRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.shopRepository = shopRepository;
    }
    async getCurrentSubscription(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const subscription = await this.subscriptionRepository.findOne({
            where: { shopId: shop.id, status: subscription_entity_1.SubscriptionStatus.ACTIVE },
            order: { endDate: 'DESC' },
        });
        if (!subscription) {
            return {
                plan: subscription_entity_1.SubscriptionPlan.STARTER,
                productLimit: 30,
                price: 0,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                productCount: 0,
                endDate: null,
            };
        }
        const productCount = await this.shopRepository.manager
            .createQueryBuilder()
            .from('products', 'p')
            .where('p.shopId = :shopId', { shopId: shop.id })
            .select('COUNT(*)', 'count')
            .getRawOne();
        return {
            ...subscription,
            productCount: parseInt(productCount?.count || '0'),
        };
    }
    getAvailablePlans() {
        return exports.SUBSCRIPTION_PLANS;
    }
    async subscribe(ownerId, subscribeDto) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const planDetails = exports.SUBSCRIPTION_PLANS.find(p => p.plan === subscribeDto.plan);
        if (!planDetails) {
            throw new common_1.BadRequestException('Invalid subscription plan');
        }
        await this.subscriptionRepository.update({ shopId: shop.id, status: subscription_entity_1.SubscriptionStatus.ACTIVE }, { status: subscription_entity_1.SubscriptionStatus.CANCELLED });
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        const subscription = this.subscriptionRepository.create({
            shopId: shop.id,
            plan: subscribeDto.plan,
            productLimit: planDetails.productLimit,
            price: planDetails.price,
            startDate,
            endDate,
            status: planDetails.price > 0 ? subscription_entity_1.SubscriptionStatus.PENDING : subscription_entity_1.SubscriptionStatus.ACTIVE,
            autoRenew: subscribeDto.autoRenew || false,
        });
        await this.subscriptionRepository.save(subscription);
        if (planDetails.price > 0) {
        }
        return subscription;
    }
    async cancelSubscription(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        const subscription = await this.subscriptionRepository.findOne({
            where: { shopId: shop.id, status: subscription_entity_1.SubscriptionStatus.ACTIVE },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('No active subscription');
        }
        subscription.status = subscription_entity_1.SubscriptionStatus.CANCELLED;
        subscription.autoRenew = false;
        await this.subscriptionRepository.save(subscription);
        return { message: 'Subscription cancelled successfully' };
    }
    async getSubscriptionHistory(ownerId) {
        const shop = await this.shopRepository.findOne({ where: { ownerId } });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found');
        }
        return this.subscriptionRepository.find({
            where: { shopId: shop.id },
            order: { createdAt: 'DESC' },
        });
    }
    async checkProductLimit(shopId) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { shopId, status: subscription_entity_1.SubscriptionStatus.ACTIVE },
        });
        const productCount = await this.shopRepository.manager
            .createQueryBuilder()
            .from('products', 'p')
            .where('p.shopId = :shopId', { shopId })
            .andWhere('p.status IN (:...statuses)', { statuses: ['approved', 'pending'] })
            .select('COUNT(*)', 'count')
            .getRawOne();
        const limit = subscription?.productLimit || 30;
        return parseInt(productCount?.count || '0') < limit;
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map