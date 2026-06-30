import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadFile(user: any, file: Express.Multer.File, type?: string): Promise<{
        uploadUrl: string;
        key: string;
        publicUrl: string;
        fileType: string;
    }>;
    uploadVideo(user: any, file: Express.Multer.File): Promise<{
        uploadUrl: string;
        key: string;
        jobId: import("bull").JobId;
        status: string;
        message: string;
        publicUrl: string;
        chargeAmount: number;
        plan: import("../../core/entities/subscription.entity").SubscriptionPlan;
        monthlyCount: number;
        freeLimit: number;
        isWithinFreeLimit: boolean;
        chargeMessage: string;
    }>;
    getVideoStats(user: any): Promise<{
        plan: import("../../core/entities/subscription.entity").SubscriptionPlan;
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
    getVideoProcessingStatus(jobId: string): Promise<{
        jobId: string;
        state: import("bull").JobStatus | "stuck";
        progress: any;
        result: any;
    }>;
}
