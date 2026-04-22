export declare class AiController {
    scanProductFree(files: Express.Multer.File[]): Promise<{
        suggestedName: string;
        suggestedPrice: number | null;
        suggestedUnit: string | null;
        rawText: string;
        success: boolean;
        extractedText: string;
    }>;
    private parseProductInfo;
}
