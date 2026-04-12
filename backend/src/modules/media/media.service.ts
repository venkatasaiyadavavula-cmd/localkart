import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUploadUrl, getSignedViewUrl, BUCKET_NAME } from '../../config/storage.config';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectQueue('media') private readonly mediaQueue: Queue,
  ) {}

  async uploadFile(userId: string, file: Express.Multer.File, type?: string) {
    const extension = file.originalname.split('.').pop();
    const key = `uploads/${userId}/${uuidv4()}.${extension}`;

    const uploadUrl = await getSignedUploadUrl(key, file.mimetype);

    return {
      uploadUrl,
      key,
      publicUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
      fileType: file.mimetype,
    };
  }

  async uploadVideo(userId: string, file: Express.Multer.File) {
    const extension = file.originalname.split('.').pop();
    const key = `videos/${userId}/${uuidv4()}.${extension}`;
    const uploadUrl = await getSignedUploadUrl(key, file.mimetype);

    // Add video transcoding job to queue
    const job = await this.mediaQueue.add('transcode', {
      userId,
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return {
      uploadUrl,
      key,
      jobId: job.id,
      status: 'pending',
      message: 'Video uploaded. Transcoding in progress.',
    };
  }

  async getSignedUrl(key: string) {
    return { url: await getSignedViewUrl(key) };
  }

  async getVideoStatus(jobId: string) {
    const job = await this.mediaQueue.getJob(jobId);
    if (!job) {
      throw new BadRequestException('Job not found');
    }

    const state = await job.getState();
    const progress = job.progress();

    let result = null;
    if (state === 'completed') {
      result = job.returnvalue;
    }

    return {
      jobId,
      state,
      progress,
      result,
    };
  }
}
