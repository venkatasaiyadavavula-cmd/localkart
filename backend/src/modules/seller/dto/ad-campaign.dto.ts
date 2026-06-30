import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsObject,
  IsOptional,
} from 'class-validator';
import { AdType, AdStatus } from '../../../core/entities/sponsored-product.entity';

export class CreateAdCampaignDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsEnum(AdType)
  @IsOptional()
  adType?: AdType = AdType.SPONSORED;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

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
