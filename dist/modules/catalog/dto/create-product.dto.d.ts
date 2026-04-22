import { ProductCategoryType } from '../../../core/entities/product.entity';
export declare class CreateProductDto {
    name: string;
    description?: string;
    price: number;
    mrp?: number;
    stock: number;
    sku?: string;
    brand?: string;
    categoryType: ProductCategoryType;
    categoryId?: string;
    images?: string[];
    videos?: string[];
    attributes?: Record<string, any>;
}
