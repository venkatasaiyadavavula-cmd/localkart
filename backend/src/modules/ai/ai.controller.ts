import {
  Controller, Post, Get,
  UseInterceptors, UploadedFiles,
  BadRequestException, UseGuards, Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ── Scan product image → name, price, unit, description, category ──
  @Post('scan-product')
  @Roles(UserRole.SELLER)
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: memoryStorage(),
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async scanProduct(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('Upload at least one product image');

    const result = await this.aiService.processProductImages(files);

    return {
      success: true,
      data: {
        name:        result.suggestedName,
        price:       result.suggestedPrice,
        unit:        result.suggestedUnit,
        description: result.suggestedDescription,
        category:    result.suggestedCategory,
        confidence:  result.confidence,
      },
      message: result.confidence >= 75
        ? 'Product scanned successfully!'
        : 'Partial scan — please verify the details.',
    };
  }

  // ── Generate AI description from product name + category ──
  @Post('generate-description')
  @Roles(UserRole.SELLER)
  @UseGuards(RolesGuard)
  async generateDescription(@Request() req: any) {
    const { name, category, price, unit } = req.body as {
      name:     string;
      category: string;
      price?:   number;
      unit?:    string;
    };

    if (!name) throw new BadRequestException('Product name is required');

    const catLabels: Record<string, string> = {
      groceries:       'Fresh grocery product',
      electronics:     'Quality electronics product',
      fashion:         'Trendy fashion item',
      beauty:          'Premium beauty product',
      home_essentials: 'Essential home product',
      accessories:     'Stylish accessory',
      sports:          'Sports and fitness product',
      books:           'Book or educational material',
    };

    const base  = catLabels[category] ?? 'Quality product';
    const parts = [`${base} — ${name}.`];
    if (unit)  parts.push(`Available in ${unit} pack.`);
    if (price) parts.push(`Best price at ₹${price}.`);
    parts.push('Sold by a trusted local shop on LocalKart. Fast delivery available.');

    return {
      success:     true,
      description: parts.join(' ').substring(0, 400),
    };
  }

  // ── Admin: manually trigger stock check ──────────────────
  @Post('admin/check-stock')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async triggerStockCheck() {
    return this.aiService.manualStockCheck();
  }
}
