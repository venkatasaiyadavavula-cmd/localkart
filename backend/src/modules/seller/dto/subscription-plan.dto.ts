import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { SubscriptionPlan } from '../../../core/entities/subscription.entity';

export class SubscribeDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean = false;
}
