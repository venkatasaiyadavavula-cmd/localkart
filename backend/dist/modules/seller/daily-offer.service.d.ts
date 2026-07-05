import { Repository } from 'typeorm';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { CreateDailyOfferDto } from './dto/daily-offer.dto';
export declare class DailyOfferService {
    private readonly offerRepository;
    private readonly productRepository;
    private readonly shopRepository;
    constructor(offerRepository: Repository<DailyOffer>, productRepository: Repository<Product>, shopRepository: Repository<Shop>);
    private getShop;
    private startOfToday;
    getActiveOffers(ownerId: string): Promise<DailyOffer[]>;
    createOffer(ownerId: string, dto: CreateDailyOfferDto): Promise<DailyOffer>;
    deleteOffer(ownerId: string, offerId: string): Promise<{
        message: string;
    }>;
}
