import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SponsoredProduct, AdStatus, AdType } from '../../core/entities/sponsored-product.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { FeaturedVideo } from '../../core/entities/featured-video.entity';
import { AdCampaignCharge } from '../../core/entities/ad-campaign-charge.entity';
import { CreateAdCampaignDto, UpdateAdCampaignDto } from './dto/ad-campaign.dto';
import { AD_PACKAGES, AdPackage } from './ad-packages';

@Injectable()
export class AdCampaignService {
  constructor(
    @InjectRepository(SponsoredProduct)
    private readonly adRepository: Repository<SponsoredProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(FeaturedVideo)
    private readonly featuredVideoRepository: Repository<FeaturedVideo>,
    @InjectRepository(AdCampaignCharge)
    private readonly adChargeRepository: Repository<AdCampaignCharge>,
  ) {}

  async getCampaigns(ownerId: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return this.adRepository.find({
      where: { shopId: shop.id },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async createCampaign(ownerId: string, dto: CreateAdCampaignDto) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const product = await this.productRepository.findOne({
      where: { id: dto.productId, shopId: shop.id, status: ProductStatus.APPROVED },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not approved');
    }

    const existing = await this.adRepository.findOne({
      where: { productId: dto.productId, status: AdStatus.ACTIVE },
    });
    if (existing) {
      throw new BadRequestException('Product already has an active ad campaign');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    let endDate: Date;
    let totalCost: number;
    let costPerDay: number;

    if (dto.package && AD_PACKAGES[dto.package as AdPackage]) {
      const pkg = AD_PACKAGES[dto.package as AdPackage];
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + pkg.days);
      totalCost = pkg.price;
      costPerDay = parseFloat((pkg.price / pkg.days).toFixed(2));
    } else {
      endDate = new Date(dto.endDate);
      const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      costPerDay = 50;
      totalCost = days * costPerDay;
    }

    const adType = dto.adType || AdType.SPONSORED;

    const campaign = this.adRepository.create({
      productId: dto.productId,
      shopId: shop.id,
      adType,
      status: AdStatus.PENDING,
      costPerDay,
      startDate,
      endDate,
      totalCost,
      targeting: dto.targeting,
    });

    await this.adRepository.save(campaign);

    await this.recordAdCharge({
      shopId: shop.id,
      amount: totalCost,
      productId: dto.productId,
      sponsoredProductId: campaign.id,
    });

    if (startDate <= new Date()) {
      campaign.status = AdStatus.ACTIVE;
      product.isSponsored = true;
      product.sponsoredUntil = endDate;
      await Promise.all([
        this.adRepository.save(campaign),
        this.productRepository.save(product),
      ]);
    }

    return campaign;
  }

  async updateCampaign(ownerId: string, id: string, dto: UpdateAdCampaignDto) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const campaign = await this.adRepository.findOne({
      where: { id, shopId: shop.id },
      relations: ['product'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (dto.status) {
      this.assertSellerMaySetStatus(campaign, dto.status);
      if (dto.status === AdStatus.PAUSED) {
        campaign.pausedByAdmin = false;
      }
      await this.applyCampaignStatus(campaign, dto.status);
    }

    const { status: _status, ...rest } = dto;
    Object.assign(campaign, rest);
    if (dto.status) {
      campaign.status = dto.status;
    }
    await this.adRepository.save(campaign);
    return campaign;
  }

  async pauseCampaign(ownerId: string, id: string) {
    return this.updateCampaign(ownerId, id, { status: AdStatus.PAUSED });
  }

  async resumeCampaign(ownerId: string, id: string) {
    return this.updateCampaign(ownerId, id, { status: AdStatus.ACTIVE });
  }

  async pauseCampaignAsAdmin(id: string) {
    const campaign = await this.adRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    await this.applyCampaignStatus(campaign, AdStatus.PAUSED);
    campaign.status = AdStatus.PAUSED;
    campaign.pausedByAdmin = true;
    await this.adRepository.save(campaign);
    return campaign;
  }

  async resumeCampaignAsAdmin(id: string) {
    const campaign = await this.adRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    campaign.pausedByAdmin = false;
    await this.applyCampaignStatus(campaign, AdStatus.ACTIVE);
    campaign.status = AdStatus.ACTIVE;
    await this.adRepository.save(campaign);
    return campaign;
  }

  async listCampaignsForAdmin(page = 1, limit = 30) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const [campaigns, campaignTotal] = await this.adRepository.findAndCount({
      relations: ['product', 'shop'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    const campaignIds = campaigns.map((c) => c.id);
    const charges = campaignIds.length
      ? await this.adChargeRepository.find({
          where: { sponsoredProductId: In(campaignIds) },
        })
      : [];

    const chargeByCampaign = new Map(
      charges.map((ch) => [ch.sponsoredProductId!, ch]),
    );

    const sponsoredRows = campaigns.map((c) => {
      const charge = chargeByCampaign.get(c.id);
      return {
        id: c.id,
        kind: 'sponsored' as const,
        shopId: c.shopId,
        shopName: c.shop?.name ?? '—',
        productId: c.productId,
        productName: c.product?.name ?? '—',
        adType: c.adType,
        status: c.status,
        pausedByAdmin: c.pausedByAdmin,
        startDate: c.startDate,
        endDate: c.endDate,
        totalCost: Number(c.totalCost),
        chargeRecorded: Boolean(charge),
        chargeAmount: charge ? Number(charge.amount) : null,
        chargeBilled: Boolean(charge?.commissionBillId),
        createdAt: c.createdAt,
      };
    });

    const [featured, featuredTotal] = await this.featuredVideoRepository.findAndCount({
      relations: ['product', 'shop'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    const featuredIds = featured.map((f) => f.id);
    const featuredCharges = featuredIds.length
      ? await this.adChargeRepository
          .createQueryBuilder('c')
          .where('c.featuredVideoId IN (:...ids)', { ids: featuredIds })
          .getMany()
      : [];

    const chargeByFeatured = new Map(
      featuredCharges.map((ch) => [ch.featuredVideoId!, ch]),
    );

    const featuredRows = featured.map((f) => {
      const charge = chargeByFeatured.get(f.id);
      const start = f.createdAt;
      const end = f.expiresAt;
      return {
        id: f.id,
        kind: 'featured_video' as const,
        shopId: f.shopId,
        shopName: f.shop?.name ?? '—',
        productId: f.productId,
        productName: f.product?.name ?? '—',
        adType: 'featured_video',
        status: f.status,
        startDate: start,
        endDate: end,
        totalCost: Number(f.amount),
        chargeRecorded: Boolean(charge),
        chargeAmount: charge ? Number(charge.amount) : null,
        chargeBilled: Boolean(charge?.commissionBillId),
        createdAt: f.createdAt,
      };
    });

    const data = [...sponsoredRows, ...featuredRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      data,
      meta: {
        page,
        limit: take,
        total: campaignTotal + featuredTotal,
        totalPages: Math.ceil((campaignTotal + featuredTotal) / take) || 1,
      },
    };
  }

  async getCampaignStats(ownerId: string, id: string) {
    const shop = await this.shopRepository.findOne({ where: { ownerId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const campaign = await this.adRepository.findOne({
      where: { id, shopId: shop.id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return {
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
      spent: campaign.totalCost,
      status: campaign.status,
      remainingDays: Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    };
  }

  private async recordAdCharge(params: {
    shopId: string;
    amount: number;
    productId?: string;
    sponsoredProductId?: string;
    featuredVideoId?: string;
  }) {
    if (params.amount <= 0) return;
    await this.adChargeRepository.save(
      this.adChargeRepository.create({
        shopId: params.shopId,
        amount: params.amount,
        productId: params.productId ?? null,
        sponsoredProductId: params.sponsoredProductId ?? null,
        featuredVideoId: params.featuredVideoId ?? null,
      }),
    );
  }

  private assertSellerMaySetStatus(campaign: SponsoredProduct, status: AdStatus) {
    if (status === AdStatus.ACTIVE && campaign.pausedByAdmin) {
      throw new ForbiddenException(
        'This campaign was paused by admin and cannot be resumed by the seller. Contact support.',
      );
    }
  }

  private async applyCampaignStatus(campaign: SponsoredProduct, status: AdStatus) {
    campaign.status = status;
    if (!campaign.product) {
      const product = await this.productRepository.findOne({
        where: { id: campaign.productId },
      });
      if (!product) return;
      campaign.product = product;
    }
    if (status === AdStatus.ACTIVE) {
      campaign.product.isSponsored = true;
      campaign.product.sponsoredUntil = campaign.endDate;
      await this.productRepository.save(campaign.product);
    } else if (
      status === AdStatus.PAUSED ||
      status === AdStatus.EXPIRED ||
      status === AdStatus.CANCELLED
    ) {
      campaign.product.isSponsored = false;
      campaign.product.sponsoredUntil = null;
      await this.productRepository.save(campaign.product);
    }
  }
}
