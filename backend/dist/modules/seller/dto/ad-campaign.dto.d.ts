import { AdType, AdStatus } from '../../../core/entities/sponsored-product.entity';
import { AdPackage } from '../ad-packages';
export declare enum AdPackageType {
    DAY = "day",
    WEEK = "week",
    MONTH = "month"
}
export declare class CreateAdCampaignDto {
    productId: string;
    adType?: AdType;
    package?: AdPackage;
    startDate?: string;
    endDate?: string;
    targeting?: {
        pincodes?: string[];
        categories?: string[];
    };
}
export declare class UpdateAdCampaignDto {
    status?: AdStatus;
    endDate?: string;
}
