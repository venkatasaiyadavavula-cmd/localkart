import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductCategoryType } from '../../core/entities/product.entity';
import { CommissionRatesService } from '../catalog/commission-rates.service';

@Injectable()
export class CommissionService {
  constructor(private readonly commissionRatesService: CommissionRatesService) {}

  async getCategoryCommissionRates() {
    return this.commissionRatesService.listCategoryRates();
  }

  async updateCategoryCommission(categoryType: string, rate: number) {
    if (!Object.values(ProductCategoryType).includes(categoryType as ProductCategoryType)) {
      throw new NotFoundException('Invalid category type');
    }
    return this.commissionRatesService.updateCategoryRate(
      categoryType as ProductCategoryType,
      rate,
    );
  }
}
