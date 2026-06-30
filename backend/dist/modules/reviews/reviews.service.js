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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("../../core/entities/review.entity");
const order_entity_1 = require("../../core/entities/order.entity");
const product_entity_1 = require("../../core/entities/product.entity");
let ReviewsService = class ReviewsService {
    reviewRepo;
    orderRepo;
    productRepo;
    constructor(reviewRepo, orderRepo, productRepo) {
        this.reviewRepo = reviewRepo;
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
    }
    async createReview(userId, dto) {
        const order = await this.orderRepo.findOne({
            where: { id: dto.orderId, customerId: userId, status: order_entity_1.OrderStatus.DELIVERED },
            relations: ['items'],
        });
        if (!order) {
            throw new common_1.BadRequestException('You can only review products from delivered orders');
        }
        const hasProduct = order.items?.some(item => item.productId === dto.productId);
        if (!hasProduct) {
            throw new common_1.ForbiddenException('This product is not in your order');
        }
        const existing = await this.reviewRepo.findOne({
            where: { productId: dto.productId, customerId: userId },
        });
        if (existing) {
            throw new common_1.BadRequestException('You already reviewed this product');
        }
        const review = this.reviewRepo.create({
            productId: dto.productId,
            customerId: userId,
            orderId: dto.orderId,
            rating: dto.rating,
            comment: dto.comment,
            isVerifiedPurchase: true,
        });
        await this.reviewRepo.save(review);
        await this.updateProductRating(dto.productId);
        return review;
    }
    async getProductReviews(productId, page = 1, limit = 10) {
        const [reviews, total] = await this.reviewRepo.findAndCount({
            where: { productId },
            relations: ['customer'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        const ratingBreakdown = await this.reviewRepo
            .createQueryBuilder('r')
            .select('r.rating', 'rating')
            .addSelect('COUNT(*)', 'count')
            .where('r.productId = :productId', { productId })
            .groupBy('r.rating')
            .getRawMany();
        return {
            reviews: reviews.map(r => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                isVerifiedPurchase: r.isVerifiedPurchase,
                helpfulCount: r.helpfulCount,
                createdAt: r.createdAt,
                customer: {
                    name: r.customer?.name?.split(' ')[0] + ' ' +
                        (r.customer?.name?.split(' ')[1]?.[0] || '') + '.',
                },
            })),
            total,
            page,
            ratingBreakdown,
        };
    }
    async markHelpful(reviewId, userId) {
        const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        await this.reviewRepo.increment({ id: reviewId }, 'helpfulCount', 1);
        return { message: 'Marked as helpful' };
    }
    async canReview(userId, productId) {
        const alreadyReviewed = !!(await this.reviewRepo.findOne({
            where: { productId, customerId: userId },
        }));
        if (alreadyReviewed)
            return { canReview: false, alreadyReviewed: true };
        const order = await this.orderRepo
            .createQueryBuilder('o')
            .innerJoin('o.items', 'i')
            .where('o.customerId = :userId', { userId })
            .andWhere('o.status = :status', { status: order_entity_1.OrderStatus.DELIVERED })
            .andWhere('i.productId = :productId', { productId })
            .getOne();
        return {
            canReview: !!order,
            orderId: order?.id,
            alreadyReviewed: false,
        };
    }
    async updateProductRating(productId) {
        const result = await this.reviewRepo
            .createQueryBuilder('r')
            .select('AVG(r.rating)', 'avg')
            .addSelect('COUNT(*)', 'count')
            .where('r.productId = :productId', { productId })
            .getRawOne();
        await this.productRepo.update(productId, {
            rating: parseFloat(result.avg) || 0,
            reviewCount: parseInt(result.count) || 0,
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map