import { IsString, IsNotEmpty, Length, IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
