import { IsString, IsNotEmpty, Length, IsOptional, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Phone must be 10 digits' })
  phone: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  orderId?: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Phone must be 10 digits' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  orderId?: string;
}
