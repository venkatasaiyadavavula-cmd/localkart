import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  IsPhoneNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../core/entities/order.entity';

class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  pincode: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;
}

export class CreateOrderDto {
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.COD;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsString()
  @IsOptional()
  deliveryNotes?: string;
}
