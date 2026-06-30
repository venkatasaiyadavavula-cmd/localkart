import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhookController } from './webhook.controller';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { Order } from '../../core/entities/order.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { CommissionBill } from '../../core/entities/commission-bill.entity';
import { Shop } from '../../core/entities/shop.entity';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Transaction, CommissionBill, Shop]),
    OrdersModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PaymentsController, WebhookController, CommissionController],
  providers: [PaymentsService, CommissionService],
  exports: [PaymentsService, CommissionService],
})
export class PaymentsModule {}

