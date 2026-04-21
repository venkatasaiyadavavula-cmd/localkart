import { IsString, IsOptional } from 'class-validator';

export class UploadQueryDto {
  @IsString()
  @IsOptional()
  type?: string;
}
