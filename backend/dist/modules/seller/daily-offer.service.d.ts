import { Repository } from 'typeorm';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
export declare class DailyOfferService {
    private readonly offerRepository;
    private readonly productRepository;
    private readonly shopRepository;
    constructor(offerRepository: Repository<DailyOffer>, productRepository: Repository<Product>, shopRepository: Repository<Shop>);
    private getShop;
    getActiveOffers(ownerId: string): Promise<DailyOffer[]>;
    createOffer(ownerId: string, productId: string, offerPrice: number): Promise<DailyOffer>;
    deleteOffer(ownerId: string, offerId: string): Promise<{
        message: string;
    }>;
}
