import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TrackingGateway } from './tracking.gateway';
import { OrderStateMachine } from './workflows/order-state-machine';
import { Order } from '../../core/entities/order.entity';
import { OrderItem } from '../../core/entities/order-item.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { CartModule } from '../cart/cart.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, Shop, User, Transaction]),
    CartModule,
    NotificationsModule,
    LocationModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, TrackingGateway, OrderStateMachine],
  exports: [OrdersService, TrackingGateway, OrderStateMachine],
})
export class OrdersModule {}
