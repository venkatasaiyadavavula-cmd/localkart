import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { SubscriptionService } from './subscription.service';
import { EarningsService } from './earnings.service';
import { AdCampaignService } from './ad-campaign.service';
import { Shop } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Product } from '../../core/entities/product.entity';
import { Order } from '../../core/entities/order.entity';
import { Subscription } from '../../core/entities/subscription.entity';
import { SponsoredProduct } from '../../core/entities/sponsored-product.entity';
import { Transaction } from '../../core/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shop,
      User,
      Product,
      Order,
      Subscription,
      SponsoredProduct,
      Transaction,
    ]),
    BullModule.registerQueue({
      name: 'media',
    }),
  ],
  controllers: [SellerController],
  providers: [SellerService, SubscriptionService, EarningsService, AdCampaignService],
  exports: [SellerService, SubscriptionService, EarningsService, AdCampaignService],
})
export class SellerModule {}
