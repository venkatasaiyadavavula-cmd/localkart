import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/entities/user.entity';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new BadRequestException('Invalid file type'), false);
      }
      cb(null, true);
    },
  }))
  async uploadFile(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type?: string,
  ) {
    return this.mediaService.uploadFile(user.id, file, type);
  }

  @Post('upload-video')
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('video/')) {
        return cb(new BadRequestException('Only video files allowed'), false);
      }
      cb(null, true);
    },
  }))
  async uploadVideo(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadVideo(user.id, file);
  }

  @Get('signed-url/:key')
  async getSignedUrl(@Param('key') key: string) {
    return this.mediaService.getSignedUrl(key);
  }

  @Get('video-status/:jobId')
  async getVideoProcessingStatus(@Param('jobId') jobId: string) {
    return this.mediaService.getVideoStatus(jobId);
  }
}
