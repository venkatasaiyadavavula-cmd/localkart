import { IsString, IsNotEmpty, Length, IsPhoneNumber, IsOptional } from 'class-validator';

export class SendOtpDto {
  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  orderId?: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber('IN')
  @IsNotEmpty()
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
