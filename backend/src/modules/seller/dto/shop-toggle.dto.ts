import { IsEnum, IsOptional } from 'class-validator';
import { ManualOverride } from '../../../core/entities/shop.entity';

export class ShopToggleDto {
  @IsEnum(ManualOverride)
  manualOverride: ManualOverride;

  @IsOptional()
  resetToSchedule?: boolean;
}
