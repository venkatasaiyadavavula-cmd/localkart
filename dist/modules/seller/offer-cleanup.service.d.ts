import { Repository } from 'typeorm';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
export declare class OfferCleanupService {
    private offerRepository;
    private readonly logger;
    constructor(offerRepository: Repository<DailyOffer>);
    cleanupExpiredOffers(): Promise<void>;
}
