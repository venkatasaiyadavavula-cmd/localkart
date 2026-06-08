import { ProductCategoryType } from '../../../core/entities/product.entity';
export declare class SearchQueryDto {
    page?: number;
    limit?: number;
    categoryType?: ProductCategoryType;
    categoryId?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
