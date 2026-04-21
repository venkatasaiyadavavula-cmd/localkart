import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhookController } from './webhook.controller';
import { Order } from '../../core/entities/order.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Transaction]),
    OrdersModule,
  ],
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
