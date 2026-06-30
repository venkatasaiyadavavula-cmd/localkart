import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createReview(user: any, dto: {
        productId: string;
        orderId: string;
        rating: number;
        comment?: string;
    }): Promise<import("../../core/entities/review.entity").Review>;
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
    canReview(user: any, productId: string): Promise<{
        canReview: boolean;
        orderId?: string;
        alreadyReviewed: boolean;
    }>;
    markHelpful(id: string, user: any): Promise<{
        message: string;
    }>;
}
