import { ProductCategoryType } from '../../../core/entities/product.entity';
export declare class NearbyShopsDto {
    latitude: number;
    longitude: number;
    radius?: number;
    categoryType?: ProductCategoryType;
    page?: number;
    limit?: number;
}
