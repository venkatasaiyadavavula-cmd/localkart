import { Repository } from 'typeorm';
import { Product } from '../../core/entities/product.entity';
import { Category } from '../../core/entities/category.entity';
import { Shop } from '../../core/entities/shop.entity';
import { Subscription, SubscriptionPlan } from '../../core/entities/subscription.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchQueryDto } from './dto/search-query.dto';
export declare class CatalogService {
    private readonly productRepository;
    private readonly categoryRepository;
    private readonly shopRepository;
    private readonly subscriptionRepository;
    constructor(productRepository: Repository<Product>, categoryRepository: Repository<Category>, shopRepository: Repository<Shop>, subscriptionRepository: Repository<Subscription>);
    getProducts(query: SearchQueryDto): Promise<{
        data: Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getProductBySlug(slug: string): Promise<Product>;
    getCategories(): Promise<Category[]>;
    getCategoryBySlug(slug: string): Promise<Category>;
    getShopProducts(shopId: string, query: SearchQueryDto): Promise<{
        data: Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createProduct(userId: string, createProductDto: CreateProductDto): Promise<Product>;
    updateProduct(userId: string, productId: string, updateProductDto: UpdateProductDto): Promise<Product>;
    deleteProduct(userId: string, productId: string): Promise<void>;
    getSellerProducts(userId: string, query: SearchQueryDto): Promise<{
        data: Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getSellerProductById(userId: string, productId: string): Promise<Product>;
    getSellerProductLimit(userId: string): Promise<{
        plan: SubscriptionPlan;
        limit: number;
        used: number;
        remaining: number;
    }>;
    approveProduct(productId: string): Promise<Product>;
    rejectProduct(productId: string, reason: string): Promise<Product>;
}
