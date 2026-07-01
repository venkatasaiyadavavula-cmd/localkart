import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import slugify from 'slugify';
import {
  Product,
  ProductCategoryType,
  ProductStatus,
} from '../../core/entities/product.entity';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';
import { CatalogService } from './catalog.service';

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]: 40,
  [SubscriptionPlan.GROWTH]: 150,
  [SubscriptionPlan.BUSINESS]: 500,
};

const CATEGORY_ALIASES: Record<string, ProductCategoryType> = {
  groceries: ProductCategoryType.GROCERIES,
  grocery: ProductCategoryType.GROCERIES,
  fashion: ProductCategoryType.FASHION,
  electronics: ProductCategoryType.ELECTRONICS,
  electronic: ProductCategoryType.ELECTRONICS,
  home_essentials: ProductCategoryType.HOME_ESSENTIALS,
  'home essentials': ProductCategoryType.HOME_ESSENTIALS,
  home: ProductCategoryType.HOME_ESSENTIALS,
  beauty: ProductCategoryType.BEAUTY,
  accessories: ProductCategoryType.ACCESSORIES,
  accessory: ProductCategoryType.ACCESSORIES,
};

export interface BulkUploadResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

@Injectable()
export class BulkUploadService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly catalogService: CatalogService,
  ) {}

  generateTemplate(): Buffer {
    const rows = [
      {
        name: 'Sample Product',
        price: 99,
        category: 'groceries',
        mrp: 120,
        stock: 50,
        description: 'Product description here',
        brand: 'BrandName',
        unit: '1kg',
      },
    ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Products');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async processUpload(userId: string, file: Express.Multer.File): Promise<BulkUploadResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }

    const shop = await this.shopRepository.findOne({
      where: { ownerId: userId, status: ShopStatus.APPROVED },
    });
    if (!shop) {
      throw new ForbiddenException('Approved shop required for bulk upload');
    }

    const limitInfo = await this.catalogService.getSellerProductLimit(userId);
    let remaining = limitInfo.remaining;

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);

    const result: BulkUploadResult = {
      total: rows.length,
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];

      try {
        const name = String(row.name ?? row.Name ?? '').trim();
        const price = Number(row.price ?? row.Price);
        const categoryRaw = String(row.category ?? row.Category ?? '').trim().toLowerCase();

        if (!name) {
          result.skipped++;
          result.errors.push({ row: rowNum, reason: 'Product name is required' });
          continue;
        }
        if (!price || price <= 0) {
          result.skipped++;
          result.errors.push({ row: rowNum, reason: 'Valid price is required' });
          continue;
        }

        const categoryType = CATEGORY_ALIASES[categoryRaw];
        if (!categoryType) {
          result.skipped++;
          result.errors.push({
            row: rowNum,
            reason: `Invalid category "${categoryRaw}". Use groceries, fashion, electronics, home_essentials, beauty, or accessories`,
          });
          continue;
        }

        if (remaining <= 0) {
          result.skipped++;
          result.errors.push({ row: rowNum, reason: 'Product plan limit reached' });
          continue;
        }

        const mrpVal = row.mrp ?? row.MRP;
        const stockVal = row.stock ?? row.Stock ?? 0;
        const descriptionBase = String(row.description ?? row.Description ?? '').trim();
        const unit = String(row.unit ?? row.Unit ?? '').trim();
        const description = [descriptionBase, unit ? `Unit: ${unit}` : ''].filter(Boolean).join(' — ') || undefined;
        const brand = String(row.brand ?? row.Brand ?? '').trim() || undefined;

        const product = this.productRepository.create({
          name,
          slug: slugify(name, { lower: true, strict: true }),
          description,
          price,
          mrp: mrpVal ? Number(mrpVal) : undefined,
          stock: Number(stockVal) || 0,
          brand,
          categoryType,
          shopId: shop.id,
          status: ProductStatus.PENDING,
          images: [],
          videos: [],
        });

        await this.productRepository.save(product);
        result.created++;
        remaining--;
      } catch (err: any) {
        result.skipped++;
        result.errors.push({ row: rowNum, reason: err.message || 'Failed to create product' });
      }
    }

    return result;
  }
}
