import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class CreateDailyOfferDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0)
  offerPrice: number;
}
