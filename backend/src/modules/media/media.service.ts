import {
  Injectable,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUploadUrl, getSignedViewUrl, BUCKET_NAME } from '../../config/storage.config';
import { Shop } from '../../core/entities/shop.entity';
import { Product } from '../../core/entities/product.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../core/entities/subscription.entity';

// ✅ Plan limits
const VIDEO_PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]:  0,  // No free videos
  [SubscriptionPlan.GROWTH]:   2,  // 2 free/month
  [SubscriptionPlan.BUSINESS]: 5,  // 5 free/month
};

const VIDEO_CHARGE_PER_UPLOAD = 10; // ₹10 per video beyond free limit

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectQueue('media')
    private readonly mediaQueue: Queue,

    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  // ─── Image Upload ──────────────────────────────────────────────────────────

  async uploadFile(userId: string, file: Express.Multer.File, type?: string) {
    if (!file) throw new BadRequestException('No file provided');

    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const folder    = type === 'avatar' ? 'avatars' : 'uploads';
    const key       = `${folder}/${userId}/${uuidv4()}.${extension}`;

    const uploadUrl = await getSignedUploadUrl(key, file.mimetype);

    return {
      uploadUrl,
      key,
      publicUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
      fileType:  file.mimetype,
    };
  }

  // ─── Video Upload with ₹10 charge logic ───────────────────────────────────

  async uploadVideo(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No video file provided');

    // Find seller's shop
    const shop = await this.shopRepo.findOne({
      where: { ownerId: userId },
    });

    if (!shop) {
      throw new ForbiddenException('Only sellers with a shop can upload videos');
    }

    // Get active subscription
    const subscription = await this.subscriptionRepo.findOne({
      where: {
        shopId: shop.id,
        status: SubscriptionStatus.ACTIVE,
        endDate: MoreThanOrEqual(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    const plan       = subscription?.plan || SubscriptionPlan.STARTER;
    const freeLimit  = VIDEO_PLAN_LIMITS[plan];

    // Count videos uploaded this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Count products with videos uploaded this month by this shop
    const monthlyVideoCount = await this.productRepo
      .createQueryBuilder('p')
      .where('p.shopId = :shopId', { shopId: shop.id })
      .andWhere('p.updatedAt >= :startOfMonth', { startOfMonth })
      .andWhere("array_length(p.videos, 1) > 0")
      .getCount();

    // Determine charge
    const isWithinFreeLimit = monthlyVideoCount < freeLimit;
    const chargeAmount       = isWithinFreeLimit ? 0 : VIDEO_CHARGE_PER_UPLOAD;

    this.logger.log(
      `Video upload: shopId=${shop.id}, plan=${plan}, ` +
      `monthlyCount=${monthlyVideoCount}, freeLimit=${freeLimit}, ` +
      `charge=₹${chargeAmount}`
    );

    // Generate upload key
    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'mp4';
    const key       = `videos/${shop.id}/${uuidv4()}.${extension}`;
    const uploadUrl = await getSignedUploadUrl(key, file.mimetype);

    // Add transcoding job to Bull queue
    const job = await this.mediaQueue.add('transcode', {
      userId,
      shopId:       shop.id,
      key,
      originalName: file.originalname,
      mimeType:     file.mimetype,
      size:         file.size,
      chargeAmount,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return {
      uploadUrl,
      key,
      jobId:        job.id,
      status:       'pending',
      message:      'Video uploaded. Transcoding in progress.',
      publicUrl:    `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
      chargeAmount,
      plan,
      monthlyCount: monthlyVideoCount + 1,
      freeLimit,
      isWithinFreeLimit,
      chargeMessage: isWithinFreeLimit
        ? `✅ Free video (${monthlyVideoCount + 1}/${freeLimit} this month)`
        : `💳 ₹${VIDEO_CHARGE_PER_UPLOAD} will be charged for this video upload`,
    };
  }

  // ─── Get video upload status ───────────────────────────────────────────────

  async getVideoStatus(jobId: string) {
    const job = await this.mediaQueue.getJob(jobId);
    if (!job) throw new BadRequestException('Job not found');

    const state    = await job.getState();
    const progress = job.progress();
    const result   = state === 'completed' ? job.returnvalue : null;

    return { jobId, state, progress, result };
  }

  // ─── Get seller video upload stats ────────────────────────────────────────

  async getVideoStats(userId: string) {
    const shop = await this.shopRepo.findOne({ where: { ownerId: userId } });
    if (!shop) throw new ForbiddenException('No shop found');

    const subscription = await this.subscriptionRepo.findOne({
      where: {
        shopId: shop.id,
        status: SubscriptionStatus.ACTIVE,
        endDate: MoreThanOrEqual(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    const plan      = subscription?.plan || SubscriptionPlan.STARTER;
    const freeLimit = VIDEO_PLAN_LIMITS[plan];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCount = await this.productRepo
      .createQueryBuilder('p')
      .where('p.shopId = :shopId', { shopId: shop.id })
      .andWhere('p.updatedAt >= :startOfMonth', { startOfMonth })
      .andWhere("array_length(p.videos, 1) > 0")
      .getCount();

    const totalVideos = await this.productRepo
      .createQueryBuilder('p')
      .where('p.shopId = :shopId', { shopId: shop.id })
      .andWhere("array_length(p.videos, 1) > 0")
      .getCount();

    return {
      plan,
      freeLimit,
      monthlyCount,
      remaining:         Math.max(0, freeLimit - monthlyCount),
      totalVideos,
      chargePerVideo:    VIDEO_CHARGE_PER_UPLOAD,
      nextVideoIsFree:   monthlyCount < freeLimit,
      nextVideoCharge:   monthlyCount >= freeLimit ? VIDEO_CHARGE_PER_UPLOAD : 0,
    };
  }

  // ─── Signed URL for viewing ────────────────────────────────────────────────

  async getSignedUrl(key: string) {
    return { url: await getSignedViewUrl(key) };
  }
}
