import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../core/entities/user.entity';
import { Shop } from '../../core/entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Shop])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
