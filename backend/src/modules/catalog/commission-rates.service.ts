import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../core/entities/category.entity';
import { ProductCategoryType } from '../../core/entities/product.entity';
import {
  CATEGORY_TYPE_LABELS,
  CATEGORY_TYPE_TO_SLUG,
  DEFAULT_COMMISSION_RATES,
  FALLBACK_COMMISSION_RATE,
} from '../../core/constants/commission-rates.constant';

export interface CategoryCommissionRateDto {
  categoryType: ProductCategoryType;
  label: string;
  slug: string;
  rate: number;
}

@Injectable()
export class CommissionRatesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  slugForCategoryType(categoryType: ProductCategoryType): string {
    return CATEGORY_TYPE_TO_SLUG[categoryType];
  }

  /** All product-category rates in one query — use per order to avoid N+1 lookups. */
  async getRatesMap(): Promise<Record<ProductCategoryType, number>> {
    const categories = await this.categoryRepository.find();
    const bySlug = new Map(categories.map((c) => [c.slug, c]));

    const map = { ...DEFAULT_COMMISSION_RATES };
    for (const type of Object.values(ProductCategoryType)) {
      const slug = CATEGORY_TYPE_TO_SLUG[type];
      const row = bySlug.get(slug);
      if (row) {
        const rate = Number(row.commissionRate);
        if (Number.isFinite(rate) && rate > 0) {
          map[type] = rate;
        }
      }
    }
    return map;
  }

  async getRateForCategoryType(categoryType: ProductCategoryType): Promise<number> {
    const map = await this.getRatesMap();
    return map[categoryType] ?? FALLBACK_COMMISSION_RATE;
  }

  async listCategoryRates(): Promise<CategoryCommissionRateDto[]> {
    const map = await this.getRatesMap();
    return Object.values(ProductCategoryType).map((categoryType) => ({
      categoryType,
      label: CATEGORY_TYPE_LABELS[categoryType],
      slug: CATEGORY_TYPE_TO_SLUG[categoryType],
      rate: map[categoryType],
    }));
  }

  async updateCategoryRate(categoryType: ProductCategoryType, rate: number) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      throw new BadRequestException('Commission rate must be between 0 and 100');
    }

    const slug = CATEGORY_TYPE_TO_SLUG[categoryType];
    const category = await this.categoryRepository.findOne({ where: { slug } });
    if (!category) {
      throw new NotFoundException(`Category not found for type: ${categoryType}`);
    }

    category.commissionRate = rate;
    await this.categoryRepository.save(category);

    return {
      message: 'Commission rate updated',
      categoryType,
      rate,
      rates: await this.getRatesMap(),
    };
  }
}
