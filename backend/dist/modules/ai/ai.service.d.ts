import { Repository } from 'typeorm';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { WhatsappService } from '../notifications/whatsapp.service';
export interface ProductScanResult {
    suggestedName: string;
    suggestedPrice: number | null;
    suggestedUnit: string | null;
    suggestedDescription: string;
    suggestedCategory: string | null;
    confidence: number;
    rawText: string;
}
export interface LowStockProduct {
    productId: string;
    productName: string;
    stock: number;
    threshold: number;
}
export declare class AiService {
    private readonly productRepo;
    private readonly shopRepo;
    private readonly whatsappService;
    private readonly logger;
    constructor(productRepo: Repository<Product>, shopRepo: Repository<Shop>, whatsappService: WhatsappService);
    processProductImages(files: Express.Multer.File[]): Promise<ProductScanResult>;
    private parseProductInfo;
    private generateDescription;
    checkLowStock(): Promise<void>;
    private sendLowStockWhatsApp;
    manualStockCheck(): Promise<{
        shopsAlerted: number;
    }>;
    removeBackground(imageBuffer: Buffer): Promise<Buffer>;
}
