import { Job } from 'bull';
export declare class MediaProcessor {
    private readonly logger;
    handleTranscode(job: Job): Promise<{
        originalKey: any;
        outputs: any[];
        processedAt: Date;
    }>;
    private downloadFromS3;
    private transcodeVideo;
    private uploadTranscodedFiles;
    private cleanupTempFiles;
}
