import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

// Configurations
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

// Core Entities
import { User } from './core/entities/user.entity';
import { Shop } from './core/entities/shop.entity';
import { Product } from './core/entities/product.entity';
import { Category } from './core/entities/category.entity';
import { Order } from './core/entities/order.entity';
import { OrderItem } from './core/entities/order-item.entity';
import { Subscription } from './core/entities/subscription.entity';
import { Transaction } from './core/entities/transaction.entity';
import { ReturnRequest } from './core/entities/return-request.entity';
import { SponsoredProduct } from './core/entities/sponsored-product.entity';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LocationModule } from './modules/location/location.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SellerModule } from './modules/seller/seller.module';
import { MediaModule } from './modules/media/media.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module'; // <-- 1. AI మాడ్యూల్ ఇంపోర్ట్ చేశాం

@Module({
  imports: [
    // 2. రేట్ లిమిటింగ్ కోసం ThrottlerModule (Brute Force రక్షణ)
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 1 నిమిషం
      limit: 30,    // ఒకే IP నుండి గరిష్టంగా 30 రిక్వెస్ట్లు
    }]),

    // 3. ఎన్విరాన్మెంట్ వేరియబుల్స్ సెటప్
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig],
    }),

    // 4. డేటాబేస్ కనెక్షన్ (PostgreSQL + PostGIS)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          User, Shop, Product, Category, Order, OrderItem,
          Subscription, Transaction, ReturnRequest, SponsoredProduct,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    // 5. Redis & బుల్ క్యూ (క్యాషింగ్ & బ్యాక్గ్రౌండ్ జాబ్స్)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // 6. JWT ఆథెంటికేషన్ (గ్లోబల్ గా అందుబాటులో ఉంచడం)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') || '7d' },
      }),
      inject: [ConfigService],
      global: true,
    }),

    // 7. అన్ని ఫీచర్ మాడ్యూల్స్
    AuthModule,
    UsersModule,
    LocationModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    SellerModule,
    MediaModule,
    ReturnsModule,
    AdminModule,
    NotificationsModule,
    AiModule, // <-- 8. AI మాడ్యూల్ ని చివరిలో యాడ్ చేశాం
  ],
})
export class AppModule {}
