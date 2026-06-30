import { SubscriptionPlan } from '../../../core/entities/subscription.entity';
export declare class SubscribeDto {
    plan: SubscriptionPlan;
    autoRenew?: boolean;
}
