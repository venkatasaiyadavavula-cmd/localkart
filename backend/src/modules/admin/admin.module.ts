import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ModerationService } from './moderation.service';
import { CommissionService } from './commission.service';
import { FraudDetectionService } from './fraud-detection.service';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Order } from '../../core/entities/order.entity';
import { User } from '../../core/entities/user.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { ReturnRequest } from '../../core/entities/return-request.entity';
import { Subscription } from '../../core/entities/subscription.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shop,
      Product,
      Order,
      User,
      Transaction,
      ReturnRequest,
      Subscription,
    ]),
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, ModerationService, CommissionService, FraudDetectionService],
  exports: [AdminService],
})
export class AdminModule {}
