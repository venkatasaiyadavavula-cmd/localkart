import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ReturnReason, ReturnStatus } from '../../../core/entities/return-request.entity';

export class CreateReturnRequestDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatus)
  status: ReturnStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
