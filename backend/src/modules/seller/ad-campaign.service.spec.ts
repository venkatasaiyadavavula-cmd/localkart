import { AdCampaignService } from './ad-campaign.service';
import { AdStatus, AdType } from '../../core/entities/sponsored-product.entity';
import { ProductStatus } from '../../core/entities/product.entity';
import { AD_PACKAGES } from './ad-packages';

describe('AdCampaignService', () => {
  const shop = { id: 'shop-1', ownerId: 'owner-1' };
  const product = {
    id: 'prod-1',
    shopId: shop.id,
    status: ProductStatus.APPROVED,
    name: 'Test Product',
    isSponsored: false,
    sponsoredUntil: null,
  };

  function buildService() {
    const adRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => ({ id: 'campaign-1', ...data })),
      save: jest.fn(async (data) => data),
      find: jest.fn(),
      findAndCount: jest.fn(),
    };
    const productRepository = {
      findOne: jest.fn().mockResolvedValue({ ...product }),
      save: jest.fn(async (p) => p),
    };
    const shopRepository = {
      findOne: jest.fn().mockResolvedValue(shop),
    };
    const featuredVideoRepository = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const adChargeRepository = {
      create: jest.fn((data) => data),
      save: jest.fn().mockResolvedValue({ id: 'charge-1' }),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };

    const service = new AdCampaignService(
      adRepository as never,
      productRepository as never,
      shopRepository as never,
      featuredVideoRepository as never,
      adChargeRepository as never,
    );

    return {
      service,
      adRepository,
      productRepository,
      adChargeRepository,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['day', AD_PACKAGES.day.price],
    ['week', AD_PACKAGES.week.price],
    ['month', AD_PACKAGES.month.price],
  ] as const)('records accrual of ₹%s for %s package', async (pkg, expectedAmount) => {
    const { service, adChargeRepository } = buildService();

    await service.createCampaign('owner-1', {
      productId: product.id,
      package: pkg,
      adType: AdType.SPONSORED,
    });

    expect(adChargeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: shop.id,
        amount: expectedAmount,
        sponsoredProductId: 'campaign-1',
        productId: product.id,
      }),
    );
  });

  it('pauseCampaignAsAdmin deactivates sponsorship on the product', async () => {
    const { service, adRepository, productRepository } = buildService();
    const campaign = {
      id: 'campaign-1',
      shopId: shop.id,
      productId: product.id,
      status: AdStatus.ACTIVE,
      endDate: new Date(),
      product: { ...product, isSponsored: true, sponsoredUntil: new Date() },
    };
    adRepository.findOne.mockResolvedValue(campaign);

    await service.pauseCampaignAsAdmin('campaign-1');

    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isSponsored: false, sponsoredUntil: null }),
    );
    expect(adRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: AdStatus.PAUSED }),
    );
  });
});
