import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsPhoneNumber,
  IsEmail,
  MaxLength,
  Min,
} from 'class-validator';

export class ShopProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

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

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsPhoneNumber('IN')
  @IsNotEmpty()
  contactPhone: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  openingTime?: string;

  @IsString()
  @IsOptional()
  closingTime?: string;

  @IsArray()
  @IsOptional()
  deliveryPincodes?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryCharge?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  freeDeliveryAbove?: number;

  @IsString()
  @IsOptional()
  fssaiLicense?: string;

  @IsString()
  @IsOptional()
  gstNumber?: string;

  @IsString()
  @IsOptional()
  panCard?: string;
}
