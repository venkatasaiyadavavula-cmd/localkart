import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SponsoredProduct, AdStatus, AdType } from '../../core/entities/sponsored-product.entity';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { CreateAdCampaignDto, UpdateAdCampaignDto } from './dto/ad-campaign.dto';

@Injectable()
export class AdCampaignService {
  constructor(
    @InjectRepository(SponsoredProduct)
    private readonly adRepository: Repository<SponsoredProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
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

    // Check if product already has active campaign
    const existing = await this.adRepository.findOne({
      where: { productId: dto.productId, status: AdStatus.ACTIVE },
    });
    if (existing) {
      throw new BadRequestException('Product already has an active ad campaign');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const costPerDay = dto.adType === AdType.SPONSORED ? 100 : 10;
    const totalCost = days * costPerDay;

    const campaign = this.adRepository.create({
      productId: dto.productId,
      shopId: shop.id,
      adType: dto.adType || AdType.SPONSORED,
      status: AdStatus.PENDING,
      costPerDay,
      startDate,
      endDate,
      totalCost,
      targeting: dto.targeting,
    });

    await this.adRepository.save(campaign);

    // Mark product as sponsored if active immediately
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
      campaign.status = dto.status;
      if (dto.status === AdStatus.ACTIVE) {
        campaign.product.isSponsored = true;
        campaign.product.sponsoredUntil = campaign.endDate;
        await this.productRepository.save(campaign.product);
      } else if (dto.status === AdStatus.PAUSED || dto.status === AdStatus.EXPIRED) {
        campaign.product.isSponsored = false;
        campaign.product.sponsoredUntil = null;
        await this.productRepository.save(campaign.product);
      }
    }

    Object.assign(campaign, dto);
    await this.adRepository.save(campaign);
    return campaign;
  }

  async pauseCampaign(ownerId: string, id: string) {
    return this.updateCampaign(ownerId, id, { status: AdStatus.PAUSED });
  }

  async resumeCampaign(ownerId: string, id: string) {
    return this.updateCampaign(ownerId, id, { status: AdStatus.ACTIVE });
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
}
