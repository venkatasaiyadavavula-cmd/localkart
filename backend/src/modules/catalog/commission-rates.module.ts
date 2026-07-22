import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../core/entities/category.entity';
import { CommissionRatesService } from './commission-rates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CommissionRatesService],
  exports: [CommissionRatesService],
})
export class CommissionRatesModule {}
