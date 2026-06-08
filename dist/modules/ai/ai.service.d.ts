export interface ProductScanResult {
    suggestedName: string;
    suggestedPrice: number | null;
    suggestedUnit: string | null;
    rawText: string;
}
export declare class AiService {
    private readonly logger;
    processProductImages(files: Express.Multer.File[]): Promise<ProductScanResult>;
    private parseProductInfo;
    removeBackground(imageBuffer: Buffer): Promise<Buffer>;
}
