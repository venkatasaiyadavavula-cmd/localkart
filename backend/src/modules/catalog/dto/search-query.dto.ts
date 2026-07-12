import { IsOptional, IsString, IsNumber, IsEnum, IsIn, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProductCategoryType } from '../../../core/entities/product.entity';

export class SearchQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(ProductCategoryType)
  categoryType?: ProductCategoryType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  shopId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'price', 'name', 'displayOrder'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  hasVideo?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  sponsored?: boolean;
}
