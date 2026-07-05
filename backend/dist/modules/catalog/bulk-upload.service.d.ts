import { Repository } from 'typeorm';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { Subscription } from '../../core/entities/subscription.entity';
import { CatalogService } from './catalog.service';
export interface BulkUploadResult {
    total: number;
    created: number;
    skipped: number;
    errors: {
        row: number;
        reason: string;
    }[];
}
export declare class BulkUploadService {
    private readonly productRepository;
    private readonly shopRepository;
    private readonly subscriptionRepository;
    private readonly catalogService;
    constructor(productRepository: Repository<Product>, shopRepository: Repository<Shop>, subscriptionRepository: Repository<Subscription>, catalogService: CatalogService);
    generateTemplate(): Buffer;
    processUpload(userId: string, file: Express.Multer.File): Promise<BulkUploadResult>;
}
