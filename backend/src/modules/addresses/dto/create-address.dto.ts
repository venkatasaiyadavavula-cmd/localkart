import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { AddressType } from '../../../core/entities/saved-address.entity';

export class CreateAddressDto {
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  fullAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  landmark?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  pincode?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  /** Legacy checkout form fields */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(15)
  phone?: string;
}
