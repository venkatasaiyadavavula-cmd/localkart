import {
  Injectable, BadRequestException,
  NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../core/entities/review.entity';
import { ReviewHelpfulVote } from '../../core/entities/review-helpful-vote.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { Product } from '../../core/entities/product.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewHelpfulVote)
    private readonly helpfulVoteRepo: Repository<ReviewHelpfulVote>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async createReview(userId: string, dto: {
    productId: string;
    orderId: string;
    rating: number;
    comment?: string;
  }) {
    // Only delivered orders can be reviewed
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId, customerId: userId, status: OrderStatus.DELIVERED },
      relations: ['items'],
    });

    if (!order) {
      throw new BadRequestException('You can only review products from delivered orders');
    }

    const hasProduct = order.items?.some(item => item.productId === dto.productId);
    if (!hasProduct) {
      throw new ForbiddenException('This product is not in your order');
    }

    // Check duplicate
    const existing = await this.reviewRepo.findOne({
      where: { productId: dto.productId, customerId: userId },
    });
    if (existing) {
      throw new BadRequestException('You already reviewed this product');
    }

    const review = this.reviewRepo.create({
      productId:          dto.productId,
      customerId:         userId,
      orderId:            dto.orderId,
      rating:             dto.rating,
      comment:            dto.comment,
      isVerifiedPurchase: true,
    });

    await this.reviewRepo.save(review);

    // Update product avg rating
    await this.updateProductRating(dto.productId);

    return review;
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
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
        id:                 r.id,
        rating:             r.rating,
        comment:            r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        helpfulCount:       r.helpfulCount,
        createdAt:          r.createdAt,
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

  async markHelpful(reviewId: string, userId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    const existingVote = await this.helpfulVoteRepo.findOne({
      where: { reviewId, userId },
    });
    if (existingVote) {
      throw new BadRequestException('You already marked this review as helpful');
    }

    await this.helpfulVoteRepo.save(
      this.helpfulVoteRepo.create({ reviewId, userId }),
    );
    await this.reviewRepo.increment({ id: reviewId }, 'helpfulCount', 1);
    return { message: 'Marked as helpful' };
  }

  async canReview(userId: string, productId: string): Promise<{
    canReview: boolean;
    orderId?: string;
    alreadyReviewed: boolean;
  }> {
    const alreadyReviewed = !!(await this.reviewRepo.findOne({
      where: { productId, customerId: userId },
    }));

    if (alreadyReviewed) return { canReview: false, alreadyReviewed: true };

    const order = await this.orderRepo
      .createQueryBuilder('o')
      .innerJoin('o.items', 'i')
      .where('o.customerId = :userId', { userId })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('i.productId = :productId', { productId })
      .getOne();

    return {
      canReview:       !!order,
      orderId:         order?.id,
      alreadyReviewed: false,
    };
  }

  private async updateProductRating(productId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.productId = :productId', { productId })
      .getRawOne();

    await this.productRepo.update(productId, {
      rating:      parseFloat(result.avg) || 0,
      reviewCount: parseInt(result.count) || 0,
    });
  }
}
