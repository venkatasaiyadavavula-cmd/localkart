import { IsString, IsNotEmpty } from 'class-validator';

export class PromoteFeaturedVideoDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}
