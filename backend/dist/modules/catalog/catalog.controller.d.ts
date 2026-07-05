import { Response } from 'express';
import { Repository } from 'typeorm';
import { CatalogService } from './catalog.service';
import { SearchService } from './search.service';
import { BulkUploadService } from './bulk-upload.service';
import { FeaturedVideoService } from '../seller/featured-video.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { VisualSearchDto } from './dto/visual-search.dto';
import { Product } from '../../core/entities/product.entity';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
export declare class CatalogController {
    private readonly catalogService;
    private readonly searchService;
    private readonly bulkUploadService;
    private productRepository;
    private offerRepository;
    private readonly featuredVideoService;
    constructor(catalogService: CatalogService, searchService: SearchService, bulkUploadService: BulkUploadService, productRepository: Repository<Product>, offerRepository: Repository<DailyOffer>, featuredVideoService: FeaturedVideoService);
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
    getSponsored(lat?: string, lng?: string): Promise<Product[]>;
    getCategories(): Promise<import("../../core/entities/category.entity").Category[]>;
    getCategoryBySlug(slug: string): Promise<import("../../core/entities/category.entity").Category>;
    search(q: string, lat?: string, lng?: string): Promise<any[]>;
    visualSearch(dto: VisualSearchDto): Promise<Product[]>;
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
    getFeaturedVideos(limit?: string): Promise<{
        data: import("../../core/entities/featured-video.entity").FeaturedVideo[];
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
    getSellerProductById(user: any, id: string): Promise<Product>;
    getSellerProductLimit(user: any): Promise<{
        plan: import("../../core/entities/subscription.entity").SubscriptionPlan;
        limit: number;
        used: number;
        remaining: number;
    }>;
    downloadBulkTemplate(res: Response): Promise<void>;
    bulkUpload(user: any, file: Express.Multer.File): Promise<import("./bulk-upload.service").BulkUploadResult>;
    approveProduct(id: string): Promise<Product>;
    rejectProduct(id: string, reason: string): Promise<Product>;
}
