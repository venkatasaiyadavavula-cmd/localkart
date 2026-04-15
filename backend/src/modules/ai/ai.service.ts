import { Injectable, Logger } from '@nestjs/common';
import * as Jimp from 'jimp';
import * as Tesseract from 'tesseract.js';

export interface ProductScanResult {
  suggestedName: string;
  suggestedPrice: number | null;
  suggestedUnit: string | null;
  rawText: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async processProductImages(files: Express.Multer.File[]): Promise<ProductScanResult> {
    const extractedTexts: string[] = [];

    for (const file of files) {
      try {
        // Pre-process image for better OCR (increase contrast, greyscale)
        const image = await Jimp.read(file.buffer);
        const processedBuffer = await image
          .resize(1024, Jimp.AUTO)
          .greyscale()
          .contrast(0.5)
          .normalize()
          .getBufferAsync(Jimp.MIME_JPEG);

        // Perform OCR (completely free and offline)
        const { data: { text } } = await Tesseract.recognize(
          processedBuffer,
          'eng+tel', // English + Telugu support
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            },
          }
        );

        if (text && text.trim()) {
          extractedTexts.push(text);
        }
      } catch (error) {
        this.logger.error(`Failed to process image: ${error.message}`);
      }
    }

    const combinedText = extractedTexts.join('\n');
    return this.parseProductInfo(combinedText);
  }

  private parseProductInfo(text: string): ProductScanResult {
    const lines = text.split('\n').filter((l) => l.trim());

    // Try to find product name (first non-empty line or line with capital letters)
    let productName = lines[0] || 'Unknown Product';

    // Try to find price (₹ or Rs. followed by digits)
    const priceMatch = text.match(/(?:₹|Rs\.?)\s*(\d+(?:\.\d{1,2})?)/i);
    const estimatedPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

    // Try to find weight/quantity
    const weightMatch = text.match(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|L|pcs|pack))/i);
    const suggestedUnit = weightMatch ? weightMatch[1] : null;

    // Clean up product name (remove price/weight if accidentally included)
    if (estimatedPrice) {
      productName = productName.replace(new RegExp(`₹?\\s*${estimatedPrice}`, 'i'), '').trim();
    }
    if (suggestedUnit) {
      productName = productName.replace(new RegExp(suggestedUnit, 'i'), '').trim();
    }

    return {
      suggestedName: productName.substring(0, 100),
      suggestedPrice: estimatedPrice,
      suggestedUnit,
      rawText: text.substring(0, 500), // Limit response size
    };
  }

  // Future method: Background removal (free with @imgly/background-removal)
  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Dynamically import to avoid heavy initial load
      const { removeBackground } = await import('@imgly/background-removal-node');
      const blob = await removeBackground(imageBuffer);
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error(`Background removal failed: ${error.message}`);
      return imageBuffer; // Fallback to original
    }
  }
}
