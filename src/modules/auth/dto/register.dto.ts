import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../../core/entities/user.entity';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.CUSTOMER;
}
