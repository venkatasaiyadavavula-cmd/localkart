import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Phone must be 10 digits' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
