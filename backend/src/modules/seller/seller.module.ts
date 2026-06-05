import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { SubscriptionService } from './subscription.service';
import { EarningsService } from './earnings.service';
import { AdCampaignService } from './ad-campaign.service';
import { WeeklyEarningsScheduler } from './weekly-earnings.scheduler';
import { Shop } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Product } from '../../core/entities/product.entity';
import { Order } from '../../core/entities/order.entity';
import { Subscription } from '../../core/entities/subscription.entity';
import { SponsoredProduct } from '../../core/entities/sponsored-product.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { CommissionBill } from '../../core/entities/commission-bill.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shop, User, Product, Order,
      Subscription, SponsoredProduct, Transaction, CommissionBill,
    ]),
    BullModule.registerQueue({ name: 'media' }),
    NotificationsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SellerController],
  providers: [
    SellerService, SubscriptionService, EarningsService,
    AdCampaignService, WeeklyEarningsScheduler,
  ],
  exports: [
    SellerService, SubscriptionService, EarningsService,
    AdCampaignService, WeeklyEarningsScheduler,
  ],
})
export class SellerModule {}
