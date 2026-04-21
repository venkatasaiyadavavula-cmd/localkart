import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaProcessor } from './media.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'media',
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaProcessor],
  exports: [MediaService],
})
export class MediaModule {}
