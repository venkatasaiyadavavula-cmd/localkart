import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { DailyOffer } from '../../core/entities/daily-offer.entity';

@Injectable()
  private readonly logger = new Logger(OfferCleanupService.name);

  constructor(
    @InjectRepository(DailyOffer)
    private offerRepository: Repository<DailyOffer>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredOffers() {
    const now = new Date();
    const result = await this.offerRepository.update(
      { isActive: true, expiresAt: LessThan(now) },
      { isActive: false }
    );
    if (result.affected > 0) {
      this.logger.log(`Deactivated ${result.affected} expired offers`);
    }
  }
}
