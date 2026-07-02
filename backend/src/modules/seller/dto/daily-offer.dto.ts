import {
  IsNumber,
  IsString,
  IsNotEmpty,
  Min,
  IsOptional,
  MaxLength,
  IsObject,
} from 'class-validator';

export class CreateDailyOfferDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  offerPrice: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sellerNotes?: string;

  @IsOptional()
  @IsObject()
  offerDetails?: Record<string, string | number>;
}
