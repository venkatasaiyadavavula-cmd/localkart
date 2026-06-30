import { Repository } from 'typeorm';
import { Review } from '../../core/entities/review.entity';
import { Order } from '../../core/entities/order.entity';
import { Product } from '../../core/entities/product.entity';
export declare class ReviewsService {
    private readonly reviewRepo;
    private readonly orderRepo;
    private readonly productRepo;
    constructor(reviewRepo: Repository<Review>, orderRepo: Repository<Order>, productRepo: Repository<Product>);
    createReview(userId: string, dto: {
        productId: string;
        orderId: string;
        rating: number;
        comment?: string;
    }): Promise<Review>;
    getProductReviews(productId: string, page?: number, limit?: number): Promise<{
        reviews: {
            id: string;
            rating: number;
            comment: string;
            isVerifiedPurchase: boolean;
            helpfulCount: number;
            createdAt: Date;
            customer: {
                name: string;
            };
        }[];
        total: number;
        page: number;
        ratingBreakdown: any[];
    }>;
    markHelpful(reviewId: string, userId: string): Promise<{
        message: string;
    }>;
    canReview(userId: string, productId: string): Promise<{
        canReview: boolean;
        orderId?: string;
        alreadyReviewed: boolean;
    }>;
    private updateProductRating;
}
