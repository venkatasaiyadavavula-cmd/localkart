import { Repository } from 'typeorm';
import { FeaturedVideo, FeaturedVideoStatus } from '../../core/entities/featured-video.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
export declare class FeaturedVideoService {
    private readonly featuredRepo;
    private readonly productRepo;
    private readonly shopRepo;
    private readonly logger;
    constructor(featuredRepo: Repository<FeaturedVideo>, productRepo: Repository<Product>, shopRepo: Repository<Shop>);
    expireOldFeaturedVideos(): Promise<void>;
    promoteVideo(ownerId: string, productId: string): Promise<{
        message: string;
        hoursRemaining: number;
        id: string;
        shopId: string;
        shop: Shop;
        productId: string;
        product: Product;
        videoUrl: string;
        amount: number;
        status: FeaturedVideoStatus;
        expiresAt: Date;
        createdAt: Date;
    }>;
    getSellerFeaturedVideos(ownerId: string): Promise<FeaturedVideo[]>;
    getActiveFeaturedVideos(limit?: number): Promise<FeaturedVideo[]>;
}
