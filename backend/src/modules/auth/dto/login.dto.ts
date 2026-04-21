import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class LoginDto {
  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
