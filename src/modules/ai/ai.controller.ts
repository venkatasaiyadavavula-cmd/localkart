import { Controller, Post, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as Jimp from 'jimp';
import * as Tesseract from 'tesseract.js';

@Controller('api/ai')
export class AiController {

  @Post('scan-product-free')
  @UseInterceptors(FilesInterceptor('images', 5, { storage: memoryStorage() }))
  async scanProductFree(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No images uploaded');
    }

    try {
      const extractedTexts: string[] = [];
      
      // Process each image with FREE OCR (Tesseract)
      for (const file of files) {
        // 1. Pre-process image for better OCR (increase contrast)
        const image = await Jimp.read(file.buffer);
        await image
          .resize(1024, Jimp.AUTO)
          .greyscale()
          .contrast(0.5)
          .normalize()
          .getBufferAsync(Jimp.MIME_JPEG);

        // 2. Perform OCR (completely free and offline)
        const { data: { text } } = await Tesseract.recognize(
          file.buffer,
          'eng+tel', // English + Telugu support
          {
            logger: m => console.log(m)
          }
        );
        
        if (text && text.trim()) {
          extractedTexts.push(text);
        }
      }

      // 3. Smart extraction: Look for product name, price, etc.
      const combinedText = extractedTexts.join('\n');
      const extractedData = this.parseProductInfo(combinedText);

      return {
        success: true,
        extractedText: combinedText,
        ...extractedData
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new BadRequestException('Image processing failed. Please try with clearer images.');
    }
  }

  private parseProductInfo(text: string) {
    // Very basic rules-based extraction (No AI cost)
    const lines = text.split('\n').filter(l => l.trim());
    
    // Try to find product name (first non-empty line or line with capital letters)
    let productName = lines[0] || 'Unknown Product';
    
    // Try to find price (₹ or Rs. followed by digits)
    const priceMatch = text.match(/(?:₹|Rs\.?)\s*(\d+(?:\.\d{1,2})?)/i);
    const estimatedPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

    // Try to find weight/quantity
    const weightMatch = text.match(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|L|pcs|pack))/i);
    
    return {
      suggestedName: productName.substring(0, 100),
      suggestedPrice: estimatedPrice,
      suggestedUnit: weightMatch ? weightMatch[1] : null,
      rawText: text.substring(0, 500) // Limit response size
    };
  }
}
