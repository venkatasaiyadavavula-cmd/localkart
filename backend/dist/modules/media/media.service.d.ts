import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { Shop } from '../../core/entities/shop.entity';
import { Product } from '../../core/entities/product.entity';
import { Subscription, SubscriptionPlan } from '../../core/entities/subscription.entity';
export declare class MediaService {
    private readonly mediaQueue;
    private readonly shopRepo;
    private readonly productRepo;
    private readonly subscriptionRepo;
    private readonly logger;
    constructor(mediaQueue: Queue, shopRepo: Repository<Shop>, productRepo: Repository<Product>, subscriptionRepo: Repository<Subscription>);
    uploadFile(userId: string, file: Express.Multer.File, type?: string): Promise<{
        uploadUrl: string;
        key: string;
        publicUrl: string;
        fileType: string;
    }>;
    uploadVideo(userId: string, file: Express.Multer.File): Promise<{
        uploadUrl: string;
        key: string;
        jobId: import("bull").JobId;
        status: string;
        message: string;
        publicUrl: string;
        chargeAmount: number;
        plan: SubscriptionPlan;
        monthlyCount: number;
        freeLimit: number;
        isWithinFreeLimit: boolean;
        chargeMessage: string;
    }>;
    getVideoStatus(jobId: string): Promise<{
        jobId: string;
        state: import("bull").JobStatus | "stuck";
        progress: any;
        result: any;
    }>;
    getVideoStats(userId: string): Promise<{
        plan: SubscriptionPlan;
        freeLimit: number;
        monthlyCount: number;
        remaining: number;
        totalVideos: number;
        chargePerVideo: number;
        nextVideoIsFree: boolean;
        nextVideoCharge: number;
    }>;
    getSignedUrl(key: string): Promise<{
        url: string;
    }>;
}
