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
