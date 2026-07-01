import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategoryType } from '../../../core/entities/product.entity';

export class VisualSearchDto {
  @IsOptional()
  @IsEnum(ProductCategoryType)
  categoryType?: ProductCategoryType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
