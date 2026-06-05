import {
  Injectable, Logger, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import slugify from 'slugify';
import { Product, ProductStatus, ProductCategoryType } from '../../core/entities/product.entity';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]:  40,
  [SubscriptionPlan.GROWTH]:   150,
  [SubscriptionPlan.BUSINESS]: 500,
};

export interface BulkUploadResult {
  total:   number;
  created: number;
  skipped: number;
  errors:  { row: number; reason: string }[];
}

@Injectable()
export class BulkUploadService {
  private readonly logger = new Logger(BulkUploadService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  // ─── Get current product limit for seller ────────────────
  async getProductLimit(ownerId: string): Promise<{
    plan: SubscriptionPlan;
    limit: number;
    used: number;
    remaining: number;
  }> {
    const shop = await this.shopRepo.findOne({ where: { ownerId } });
    if (!shop) throw new ForbiddenException('Shop not found');

    const subscription = await this.subscriptionRepo.findOne({
      where: { shopId: shop.id, status: SubscriptionStatus.ACTIVE },
      order: { endDate: 'DESC' },
    });

    const plan  = subscription?.plan ?? SubscriptionPlan.STARTER;
    const limit = PLAN_LIMITS[plan];
    const used  = await this.productRepo.count({ where: { shopId: shop.id } });

    return { plan, limit, used, remaining: Math.max(0, limit - used) };
  }

  // ─── Bulk upload from Excel ───────────────────────────────
  async bulkUploadFromExcel(
    ownerId: string,
    fileBuffer: Buffer,
  ): Promise<BulkUploadResult> {
    const shop = await this.shopRepo.findOne({
      where: { ownerId, status: ShopStatus.APPROVED },
    });
    if (!shop) throw new ForbiddenException('Approved shop required');

    const { limit, used } = await this.getProductLimit(ownerId);
    const remaining       = limit - used;

    if (remaining <= 0) {
      throw new ForbiddenException(
        `Product limit reached (${used}/${limit}). Upgrade your plan to add more products.`,
      );
    }

    // Parse Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

    if (!rows.length) throw new BadRequestException('Excel file is empty');

    const result: BulkUploadResult = { total: rows.length, created: 0, skipped: 0, errors: [] };
    let slotUsed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowNum = i + 2; // Excel row (header = 1)

      try {
        // ── Validate required fields ──────────────────────
        const name  = String(row['name'] ?? row['Name'] ?? row['Product Name'] ?? '').trim();
        const price = parseFloat(row['price'] ?? row['Price'] ?? row['Selling Price'] ?? '0');
        const cat   = String(row['category'] ?? row['Category'] ?? '').toLowerCase().trim().replace(/\s+/g, '_');

        if (!name)           { result.errors.push({ row: rowNum, reason: 'Name is required' }); result.skipped++; continue; }
        if (isNaN(price) || price <= 0) { result.errors.push({ row: rowNum, reason: 'Valid price required' }); result.skipped++; continue; }
        if (!Object.values(ProductCategoryType).includes(cat as ProductCategoryType)) {
          result.errors.push({ row: rowNum, reason: `Invalid category "${cat}"` });
          result.skipped++;
          continue;
        }

        // ── Check slot ────────────────────────────────────
        if (slotUsed >= remaining) {
          result.errors.push({ row: rowNum, reason: `Plan limit reached (${limit} products). Upgrade to add more.` });
          result.skipped++;
          continue;
        }

        // ── Build slug (unique per shop) ──────────────────
        let slug    = slugify(name, { lower: true, strict: true });
        const exists = await this.productRepo.findOne({ where: { slug, shopId: shop.id } });
        if (exists) slug = `${slug}-${Date.now()}`;

        // ── Parse optional fields ─────────────────────────
        const mrp         = parseFloat(row['mrp'] ?? row['MRP'] ?? '0') || undefined;
        const stock       = parseInt(row['stock'] ?? row['Stock'] ?? '0') || 0;
        const description = String(row['description'] ?? row['Description'] ?? '').trim() || undefined;
        const brand       = String(row['brand'] ?? row['Brand'] ?? '').trim() || undefined;
        const unit        = String(row['unit'] ?? row['Unit'] ?? '').trim() || undefined;

        // ── Create product ────────────────────────────────
        const product = this.productRepo.create({
          name, slug, price,
          originalPrice: mrp,
          stock,
          description,
          brand,
          unit,
          categoryType: cat as ProductCategoryType,
          shopId:       shop.id,
          status:       ProductStatus.PENDING,
        });

        await this.productRepo.save(product);
        result.created++;
        slotUsed++;

      } catch (err) {
        result.errors.push({ row: rowNum, reason: err.message });
        result.skipped++;
      }
    }

    this.logger.log(
      `Bulk upload: shop=${shop.name} total=${result.total} created=${result.created} skipped=${result.skipped}`,
    );
    return result;
  }

  // ─── Generate Excel template for download ────────────────
  generateTemplate(): Buffer {
    const headers = [
      'name', 'price', 'mrp', 'category', 'stock',
      'description', 'brand', 'unit',
    ];

    const sampleRows = [
      {
        name: 'Toor Dal 1kg', price: 120, mrp: 140,
        category: 'groceries', stock: 50,
        description: 'Premium quality toor dal', brand: 'Local Brand', unit: '1kg',
      },
      {
        name: 'Cotton T-Shirt Blue', price: 299, mrp: 499,
        category: 'fashion', stock: 20,
        description: 'Comfortable cotton t-shirt', brand: '', unit: '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });

    // Column widths
    ws['!cols'] = headers.map(h => ({ wch: h === 'description' ? 40 : 18 }));

    // Header styling note
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    const notesWs = XLSX.utils.aoa_to_sheet([
      ['Field', 'Required', 'Notes'],
      ['name',        'YES', 'Product name (max 200 chars)'],
      ['price',       'YES', 'Selling price in ₹'],
      ['mrp',         'no',  'Original/MRP price in ₹'],
      ['category',    'YES', 'groceries / fashion / electronics / home_essentials / beauty / accessories'],
      ['stock',       'no',  'Stock quantity (default 0)'],
      ['description', 'no',  'Product description'],
      ['brand',       'no',  'Brand name'],
      ['unit',        'no',  'e.g. 1kg, 500ml, pack of 6'],
    ]);
    notesWs['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, notesWs, 'Instructions');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
