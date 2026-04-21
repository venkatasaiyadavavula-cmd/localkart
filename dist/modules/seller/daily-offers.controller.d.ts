import { Repository } from 'typeorm';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
export declare class DailyOffersController {
    private offerRepository;
    private productRepository;
    private shopRepository;
    constructor(offerRepository: Repository<DailyOffer>, productRepository: Repository<Product>, shopRepository: Repository<Shop>);
    getMyOffers(user: any): Promise<DailyOffer[]>;
    createOffer(user: any, body: {
        productId: string;
        offerPrice: number;
    }): Promise<DailyOffer>;
    deleteOffer(user: any, id: string): Promise<{
        message: string;
    }>;
}
