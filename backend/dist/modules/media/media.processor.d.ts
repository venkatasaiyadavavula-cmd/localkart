import { Job } from 'bull';
export declare class MediaProcessor {
    private readonly logger;
    handleTranscode(job: Job): Promise<{
        originalKey: any;
        outputs: {
            resolution: string;
            key: string;
            url: string;
        }[];
        processedAt: Date;
    }>;
    private downloadFromS3;
    private transcodeVideo;
    private uploadTranscodedFiles;
    private cleanupTempFiles;
}
