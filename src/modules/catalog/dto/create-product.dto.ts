import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { ProductCategoryType } from '../../../core/entities/product.entity';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  mrp?: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsEnum(ProductCategoryType)
  categoryType: ProductCategoryType;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsOptional()
  videos?: string[];

  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;
}
