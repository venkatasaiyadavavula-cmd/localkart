import { Repository } from 'typeorm';
import { CatalogService } from './catalog.service';
import { SearchService } from './search.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { Product } from '../../core/entities/product.entity';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
export declare class CatalogController {
    private readonly catalogService;
    private readonly searchService;
    private productRepository;
    private offerRepository;
    constructor(catalogService: CatalogService, searchService: SearchService, productRepository: Repository<Product>, offerRepository: Repository<DailyOffer>);
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
    getCategories(): Promise<import("../../core/entities/category.entity").Category[]>;
    getCategoryBySlug(slug: string): Promise<import("../../core/entities/category.entity").Category>;
    search(q: string, lat?: string, lng?: string): Promise<any[]>;
    getShopProducts(shopId: string, query: SearchQueryDto): Promise<{
        data: Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTodayOffers(lat?: string, lng?: string): Promise<{
        data: Product[];
    }>;
    createProduct(user: any, createProductDto: CreateProductDto): Promise<Product>;
    updateProduct(user: any, id: string, updateProductDto: UpdateProductDto): Promise<Product>;
    deleteProduct(user: any, id: string): Promise<void>;
    getSellerProducts(user: any, query: SearchQueryDto): Promise<{
        data: Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    approveProduct(id: string): Promise<Product>;
    rejectProduct(id: string, reason: string): Promise<Product>;
}
