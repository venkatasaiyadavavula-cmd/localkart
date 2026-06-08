import { Queue } from 'bull';
export declare class MediaService {
    private readonly mediaQueue;
    private readonly logger;
    constructor(mediaQueue: Queue);
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
    }>;
    getSignedUrl(key: string): Promise<{
        url: string;
    }>;
    getVideoStatus(jobId: string): Promise<{
        jobId: string;
        state: import("bull").JobStatus | "stuck";
        progress: any;
        result: any;
    }>;
}
