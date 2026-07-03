import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsObject,
  IsOptional,
} from 'class-validator';
import { AdType, AdStatus } from '../../../core/entities/sponsored-product.entity';
import { AdPackage } from '../ad-packages';

export enum AdPackageType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class CreateAdCampaignDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsEnum(AdType)
  @IsOptional()
  adType?: AdType = AdType.SPONSORED;

  @IsEnum(AdPackageType)
  @IsOptional()
  package?: AdPackage;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsObject()
  @IsOptional()
  targeting?: {
    pincodes?: string[];
    categories?: string[];
  };
}

export class UpdateAdCampaignDto {
  @IsEnum(AdStatus)
  @IsOptional()
  status?: AdStatus;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
