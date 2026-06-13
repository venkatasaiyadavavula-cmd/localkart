export declare class AiService {
    extractProductFromImage(file: any): Promise<{
        name: string;
        price: number;
        description: string;
    }>;
    generateDescription(name: string, category: string): Promise<{
        description: string;
    }>;
    removeBackground(file: any): Promise<any>;
    sendWeeklyEarnings(): Promise<{
        sent: number;
    }>;
    processProductImages(files: any[]): Promise<{
        products: any[];
        suggestedName: string;
        suggestedPrice: number;
        suggestedUnit: string;
        suggestedDescription: string;
        suggestedCategory: string;
        confidence: number;
    }>;
    manualStockCheck(): Promise<{
        checked: number;
    }>;
}
