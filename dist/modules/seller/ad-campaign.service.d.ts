import { Repository } from 'typeorm';
import { SponsoredProduct, AdStatus } from '../../core/entities/sponsored-product.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { CreateAdCampaignDto, UpdateAdCampaignDto } from './dto/ad-campaign.dto';
export declare class AdCampaignService {
    private readonly adRepository;
    private readonly productRepository;
    private readonly shopRepository;
    constructor(adRepository: Repository<SponsoredProduct>, productRepository: Repository<Product>, shopRepository: Repository<Shop>);
    getCampaigns(ownerId: string): Promise<SponsoredProduct[]>;
    createCampaign(ownerId: string, dto: CreateAdCampaignDto): Promise<SponsoredProduct>;
    updateCampaign(ownerId: string, id: string, dto: UpdateAdCampaignDto): Promise<SponsoredProduct>;
    pauseCampaign(ownerId: string, id: string): Promise<SponsoredProduct>;
    resumeCampaign(ownerId: string, id: string): Promise<SponsoredProduct>;
    getCampaignStats(ownerId: string, id: string): Promise<{
        impressions: number;
        clicks: number;
        ctr: number;
        spent: number;
        status: AdStatus;
        remainingDays: number;
    }>;
}
