import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDeliveryLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  staffName?: string;

  @IsOptional()
  @IsString()
  staffPhone?: string;
}
