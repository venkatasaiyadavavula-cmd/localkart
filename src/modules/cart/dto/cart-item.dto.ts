import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CartItem {
  @IsString()
  productId: string;

  @IsString()
  shopId: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  image?: string | null;

  @IsNumber()
  @Min(0)
  maxQuantity: number;
}

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
