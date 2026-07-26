import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../core/entities/product-variant.entity';
import { Product } from '../../core/entities/product.entity';
import { ProductVariantInputDto } from './dto/product-variant.dto';

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  validateVariants(variants: ProductVariantInputDto[]) {
    if (!variants.length) {
      throw new BadRequestException('At least one variant is required when using variants');
    }

    const keys = new Set<string>();
    for (const row of variants) {
      if (!row.attributes || Object.keys(row.attributes).length === 0) {
        throw new BadRequestException('Each variant must have attributes (e.g. color, size)');
      }
      if (row.stock < 0) {
        throw new BadRequestException('Variant stock cannot be negative');
      }
      const signature = this.variantSignature(row.attributes);
      if (keys.has(signature)) {
        throw new BadRequestException('Duplicate variant combination');
      }
      keys.add(signature);
    }
  }

  async replaceVariantsForProduct(productId: string, variants: ProductVariantInputDto[]) {
    this.validateVariants(variants);
    await this.variantRepo.delete({ productId });

    const rows = variants.map((v) =>
      this.variantRepo.create({
        productId,
        attributes: this.normalizeAttributes(v.attributes),
        stock: v.stock,
        priceOverride: v.priceOverride ?? null,
        sku: v.sku ?? null,
        image: v.image ?? null,
      }),
    );
    await this.variantRepo.save(rows);

    const totalStock = rows.reduce((sum, row) => sum + row.stock, 0);
    await this.productRepo.update(productId, {
      hasVariants: true,
      stock: totalStock,
    });
  }

  async clearVariantsForProduct(productId: string) {
    await this.variantRepo.delete({ productId });
    await this.productRepo.update(productId, { hasVariants: false });
  }

  async listByProductId(productId: string) {
    return this.variantRepo.find({ where: { productId }, order: { createdAt: 'ASC' } });
  }

  private variantSignature(attributes: Record<string, string>): string {
    const normalized = this.normalizeAttributes(attributes);
    return Object.keys(normalized)
      .sort()
      .map((k) => `${k}:${normalized[k]}`)
      .join('|');
  }

  private normalizeAttributes(attributes: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(attributes)) {
      out[key.trim().toLowerCase()] = String(value).trim();
    }
    return out;
  }
}
