import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { AddressType } from '../../../core/entities/saved-address.entity';

export class UpdateAddressDto {
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
}
