import {
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  IsNumber,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber('IN')
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsString()
  @IsOptional()
  currentPassword?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(50)
  password?: string;
}
