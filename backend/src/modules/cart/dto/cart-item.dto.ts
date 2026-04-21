import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}

export interface CartItem {
  productId: string;
  shopId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  maxQuantity: number;
}
