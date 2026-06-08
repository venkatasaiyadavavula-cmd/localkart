import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    scanProduct(files: Express.Multer.File[]): Promise<{
        success: boolean;
        data: {
            name: string;
            price: number;
            unit: string;
            description: string;
            category: string;
            confidence: number;
        };
        message: string;
    }>;
    generateDescription(req: any): Promise<{
        success: boolean;
        description: string;
    }>;
    triggerStockCheck(): Promise<{
        shopsAlerted: number;
    }>;
}
