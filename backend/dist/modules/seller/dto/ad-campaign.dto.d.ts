import { AdType, AdStatus } from '../../../core/entities/sponsored-product.entity';
export declare class CreateAdCampaignDto {
    productId: string;
    adType?: AdType;
    startDate: string;
    endDate: string;
    targeting?: {
        pincodes?: string[];
        categories?: string[];
    };
}
export declare class UpdateAdCampaignDto {
    status?: AdStatus;
    endDate?: string;
}
