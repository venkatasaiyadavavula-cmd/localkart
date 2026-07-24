import {
  Controller,
  Post,
  Get,
  Query,
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
import { RolesGuard } from '../../core/guards/roles.guard';
import { UserRole } from '../../core/entities/user.entity';
import { normalizeVideoMime } from './video-mime.util';

function acceptVideoUpload(
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const normalized = normalizeVideoMime(file.mimetype, file.originalname);
  if (!normalized) {
    return cb(
      new BadRequestException('Only video files allowed (mp4, mov, avi, webm)'),
      false,
    );
  }
  file.mimetype = normalized;
  cb(null, true);
}

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ─── Image Upload ──────────────────────────────────────────────────────────

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new BadRequestException('Invalid file type. Only images and videos allowed.'), false);
      }
      cb(null, true);
    },
  }))
  async uploadFile(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.mediaService.uploadFile(user.id, file, type);
  }

  // ─── Video Upload (Sellers only) ──────────────────────────────────────────

  @Post('upload-video')
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    fileFilter: (req, file, cb) => {
      acceptVideoUpload(file, cb);
    },
  }))
  async uploadVideo(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No video file provided');
    return this.mediaService.uploadVideo(user.id, file);
  }

  // ─── Video Stats (how many uploads, charge info) ──────────────────────────

  @Get('video-stats')
  @Roles(UserRole.SELLER)
  async getVideoStats(@CurrentUser() user: any) {
    return this.mediaService.getVideoStats(user.id);
  }

  // ─── Signed URL for secure viewing ────────────────────────────────────────

  @Get('signed-url/:key')
  async getSignedUrl(@CurrentUser() user: any, @Param('key') key: string) {
    if (!key) throw new BadRequestException('Key is required');
    return this.mediaService.getSignedUrl(key, user);
  }

  // ─── Video processing status ──────────────────────────────────────────────

  @Get('video-status/:jobId')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getVideoProcessingStatus(@CurrentUser() user: any, @Param('jobId') jobId: string) {
    return this.mediaService.getVideoStatus(jobId, user);
  }
}
