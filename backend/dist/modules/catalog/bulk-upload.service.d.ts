import { Repository } from 'typeorm';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { Subscription, SubscriptionPlan } from '../../core/entities/subscription.entity';
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
    private readonly productRepo;
    private readonly shopRepo;
    private readonly subscriptionRepo;
    private readonly logger;
    constructor(productRepo: Repository<Product>, shopRepo: Repository<Shop>, subscriptionRepo: Repository<Subscription>);
    getProductLimit(ownerId: string): Promise<{
        plan: SubscriptionPlan;
        limit: number;
        used: number;
        remaining: number;
    }>;
    bulkUploadFromExcel(ownerId: string, fileBuffer: Buffer): Promise<BulkUploadResult>;
    generateTemplate(): Buffer;
}
