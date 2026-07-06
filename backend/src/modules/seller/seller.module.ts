import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { SubscriptionService } from './subscription.service';
import { EarningsService } from './earnings.service';
import { AdCampaignService } from './ad-campaign.service';
import { WeeklyEarningsScheduler } from './weekly-earnings.scheduler';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { DailyOfferService } from './daily-offer.service';
import { FeaturedVideoModule } from './featured-video.module';
import { DailyOffer } from '../../core/entities/daily-offer.entity';
import { Shop } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Product } from '../../core/entities/product.entity';
import { Order } from '../../core/entities/order.entity';
import { Subscription } from '../../core/entities/subscription.entity';
import { SponsoredProduct } from '../../core/entities/sponsored-product.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { CommissionBill } from '../../core/entities/commission-bill.entity';
import { StaffMember } from '../../core/entities/staff-member.entity';
import { CatalogModule } from '../catalog/catalog.module';
import { OrdersModule } from '../orders/orders.module';
import { StaffWorkController } from './staff-work.controller';
import { StaffWorkService } from './staff-work.service';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shop, User, Product, Order,
      Subscription, SponsoredProduct, Transaction,
      CommissionBill, StaffMember, DailyOffer,
    ]),
    BullModule.registerQueue({ name: 'media' }),
    NotificationsModule,
    forwardRef(() => CatalogModule),
    FeaturedVideoModule,
    OrdersModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      useFactory: (cfg: ConfigService) => ({
        secret:       cfg.get('JWT_SECRET'),
        signOptions:  { expiresIn: cfg.get('JWT_EXPIRES_IN') || '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SellerController, StaffController, StaffWorkController],
  providers: [
    SellerService, SubscriptionService, EarningsService,
    AdCampaignService, WeeklyEarningsScheduler, StaffService,
    DailyOfferService, StaffWorkService, PermissionsGuard,
  ],
  exports: [
    SellerService, SubscriptionService, EarningsService,
    AdCampaignService, WeeklyEarningsScheduler, StaffService,
    DailyOfferService, FeaturedVideoModule,
  ],
})
export class SellerModule {}
