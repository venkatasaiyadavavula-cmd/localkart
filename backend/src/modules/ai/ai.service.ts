import { Injectable, Logger } from '@nestjs/common';
import * as Jimp from 'jimp';
import * as Tesseract from 'tesseract.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { WhatsappService } from '../notifications/whatsapp.service';

export interface ProductScanResult {
  suggestedName:        string;
  suggestedPrice:       number | null;
  suggestedUnit:        string | null;
  suggestedDescription: string;
  suggestedCategory:    string | null;
  confidence:           number;
  rawText:              string;
}

export interface LowStockProduct {
  productId:   string;
  productName: string;
  stock:       number;
  threshold:   number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    private readonly whatsappService: WhatsappService,
  ) {}

  // ═══════════════════════════════════════════════════════════
  //   OCR — PRODUCT IMAGE SCAN (ultra-pro version)
  // ═══════════════════════════════════════════════════════════

  async processProductImages(files: Express.Multer.File[]): Promise<ProductScanResult> {
    const extractedTexts: string[] = [];

    for (const file of files) {
      try {
        const image = await Jimp.read(file.buffer);

        const processedBuffer = await image
          .resize(1400, Jimp.AUTO)
          .greyscale()
          .contrast(0.6)
          .brightness(0.05)
          .normalize()
          .getBufferAsync(Jimp.MIME_JPEG);

        const { data: { text, confidence } } = await Tesseract.recognize(
          processedBuffer,
          'eng+tel+hin',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                this.logger.debug(`OCR: ${Math.round(m.progress * 100)}%`);
              }
            },
          },
        );

        if (text?.trim()) extractedTexts.push(text);
      } catch (err) {
        this.logger.error(`Image processing failed: ${err.message}`);
      }
    }

    const combinedText = extractedTexts.join('\n');
    return this.parseProductInfo(combinedText);
  }

  private parseProductInfo(text: string): ProductScanResult {
    const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);
    const full    = text.toLowerCase();

    // ── Product name ────────────────────────────────────────
    let suggestedName = 'Unknown Product';
    for (const line of lines) {
      if (line.length > 3 && line.length < 80 && /[a-zA-Z\u0C00-\u0C7F]/.test(line)) {
        suggestedName = line.replace(/[^a-zA-Z0-9\u0C00-\u0C7F\s\-&().]/g, '').trim();
        if (suggestedName.length > 3) break;
      }
    }

    // ── Price ────────────────────────────────────────────────
    const pricePatterns = [
      /(?:mrp|price|rate|cost)[:\s]*(?:₹|rs\.?)\s*(\d+(?:\.\d{1,2})?)/i,
      /(?:₹|rs\.?)\s*(\d+(?:\.\d{1,2})?)/i,
      /(\d+(?:\.\d{1,2})?)\s*(?:₹|rs)/i,
    ];
    let suggestedPrice: number | null = null;
    for (const pattern of pricePatterns) {
      const m = text.match(pattern);
      if (m) { suggestedPrice = parseFloat(m[1]); break; }
    }

    // ── Unit / weight ────────────────────────────────────────
    const unitMatch = text.match(
      /(\d+(?:\.\d+)?\s*(?:gm?|kg|ml|l(?:itre)?|pcs?|pieces?|pack|packet|nos?|units?))/i,
    );
    const suggestedUnit = unitMatch ? unitMatch[1].trim() : null;

    // ── Category detection ───────────────────────────────────
    const CATEGORY_KEYWORDS: Record<string, string[]> = {
      groceries:       ['rice', 'flour', 'oil', 'dal', 'sugar', 'salt', 'spice', 'masala', 'atta', 'milk', 'bread'],
      electronics:     ['mobile', 'phone', 'charger', 'cable', 'earphone', 'battery', 'adapter', 'usb', 'led'],
      fashion:         ['shirt', 'pant', 'saree', 'dress', 'kurta', 'dupatta', 'lehenga', 'jeans', 'top'],
      beauty:          ['cream', 'lotion', 'shampoo', 'soap', 'face wash', 'moisturizer', 'serum', 'lipstick'],
      home_essentials: ['bulb', 'wire', 'brush', 'bucket', 'mop', 'broom', 'container', 'jar', 'plate'],
      accessories:     ['watch', 'bag', 'wallet', 'belt', 'cap', 'glasses', 'sunglasses'],
    };
    let suggestedCategory: string | null = null;
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => full.includes(kw))) {
        suggestedCategory = cat;
        break;
      }
    }

    // ── Auto-generate description ────────────────────────────
    const suggestedDescription = this.generateDescription(
      suggestedName, suggestedPrice, suggestedUnit, suggestedCategory, lines,
    );

    // ── Confidence score ─────────────────────────────────────
    const confidence = [
      suggestedName !== 'Unknown Product',
      suggestedPrice !== null,
      suggestedUnit !== null,
      suggestedCategory !== null,
    ].filter(Boolean).length * 25;

    return {
      suggestedName:        suggestedName.substring(0, 100),
      suggestedPrice,
      suggestedUnit,
      suggestedDescription,
      suggestedCategory,
      confidence,
      rawText: text.substring(0, 500),
    };
  }

  private generateDescription(
    name:     string,
    price:    number | null,
    unit:     string | null,
    category: string | null,
    lines:    string[],
  ): string {
    const parts: string[] = [];

    const catLabels: Record<string, string> = {
      groceries:       'Fresh grocery product',
      electronics:     'Quality electronics product',
      fashion:         'Trendy fashion item',
      beauty:          'Premium beauty product',
      home_essentials: 'Essential home product',
      accessories:     'Stylish accessory',
    };

    const base = catLabels[category ?? ''] ?? 'Quality product';
    parts.push(`${base} — ${name}.`);

    if (unit)  parts.push(`Available in ${unit} pack.`);
    if (price) parts.push(`Best price at ₹${price}.`);

    const extras = lines
      .filter(l => l.length > 10 && l.length < 120)
      .filter(l => !/(?:₹|mrp|rs\.|price|barcode|batch|mfg|exp)/i.test(l))
      .slice(1, 3);
    if (extras.length) parts.push(extras.join(' '));

    parts.push('Sold by a trusted local shop on LocalKart.');

    return parts.join(' ').substring(0, 400);
  }

  // ═══════════════════════════════════════════════════════════
  //   INVENTORY ALERTS — every day 9 PM
  // ═══════════════════════════════════════════════════════════

  @Cron('0 21 * * *', { timeZone: 'Asia/Kolkata' })
  async checkLowStock() {
    this.logger.log('📦 Checking low-stock products...');

    const LOW_STOCK_THRESHOLD = 5;

    const lowStockProducts = await this.productRepo.find({
      where: {
        status: ProductStatus.ACTIVE,
        stock:  LessThanOrEqual(LOW_STOCK_THRESHOLD),
      },
      relations: ['shop', 'shop.owner'],
    });

    // Group by shop
    const byShop = new Map<string, { shop: Shop; products: LowStockProduct[] }>();

    for (const product of lowStockProducts) {
      if (!product.shop) continue;
      if (!byShop.has(product.shopId)) {
        byShop.set(product.shopId, { shop: product.shop, products: [] });
      }
      byShop.get(product.shopId)!.products.push({
        productId:   product.id,
        productName: product.name,
        stock:       product.stock,
        threshold:   LOW_STOCK_THRESHOLD,
      });
    }

    // Send WhatsApp to each shop owner
    for (const [, { shop, products }] of byShop) {
      if (!shop.contactPhone) continue;

      const outOfStock = products.filter(p => p.stock === 0);
      const lowStock   = products.filter(p => p.stock > 0);

      await this.sendLowStockWhatsApp(shop, outOfStock, lowStock);
    }

    this.logger.log(`✅ Low-stock alerts sent to ${byShop.size} shops`);
  }

  private async sendLowStockWhatsApp(
    shop:        Shop,
    outOfStock:  LowStockProduct[],
    lowStock:    LowStockProduct[],
  ) {
    const lines: string[] = [
      `📦 *LocalKart — Stock Alert*`,
      ``,
      `Shop: *${shop.name}*`,
      ``,
    ];

    if (outOfStock.length) {
      lines.push(`🔴 *Out of Stock (${outOfStock.length}):*`);
      outOfStock.slice(0, 5).forEach(p => lines.push(`  • ${p.productName}`));
      if (outOfStock.length > 5) lines.push(`  ...and ${outOfStock.length - 5} more`);
      lines.push('');
    }

    if (lowStock.length) {
      lines.push(`🟡 *Low Stock (${lowStock.length}):*`);
      lowStock.slice(0, 5).forEach(p => lines.push(`  • ${p.productName} — only *${p.stock} left*`));
      if (lowStock.length > 5) lines.push(`  ...and ${lowStock.length - 5} more`);
      lines.push('');
    }

    lines.push(`Update stock in LocalKart Seller app → Products`);

    await this.whatsappService['send'](shop.contactPhone, lines.join('\n'))
      .catch((e: Error) => this.logger.error(`Stock alert WA failed for ${shop.name}: ${e.message}`));
  }

  // ── Manual trigger (for testing) ─────────────────────────
  async manualStockCheck(): Promise<{ shopsAlerted: number }> {
    await this.checkLowStock();
    return { shopsAlerted: 1 };
  }

  // ── Background removal (future) ──────────────────────────
  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const { removeBackground } = await import('@imgly/background-removal-node');
      const blob        = await removeBackground(imageBuffer);
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      this.logger.error(`Background removal failed: ${err.message}`);
      return imageBuffer;
    }
  }
}
