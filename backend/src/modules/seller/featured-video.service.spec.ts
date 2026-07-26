import { FeaturedVideoService } from './featured-video.service';
import { ProductStatus } from '../../core/entities/product.entity';
import { FEATURED_VIDEO_PRICE } from './ad-packages';

describe('FeaturedVideoService.promoteVideo', () => {
  it('records a ₹29 accrual when featuring a video', async () => {
    const shop = { id: 'shop-1', ownerId: 'owner-1' };
    const product = {
      id: 'prod-1',
      shopId: shop.id,
      status: ProductStatus.APPROVED,
      videos: ['https://cdn.test/v.mp4'],
    };

    const featuredRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => ({ id: 'fv-1', ...data })),
      save: jest.fn(async (data) => data),
    };
    const productRepo = { findOne: jest.fn().mockResolvedValue(product) };
    const shopRepo = { findOne: jest.fn().mockResolvedValue(shop) };
    const adChargeRepo = {
      create: jest.fn((data) => data),
      save: jest.fn().mockResolvedValue({ id: 'charge-1' }),
    };

    const service = new FeaturedVideoService(
      featuredRepo as never,
      productRepo as never,
      shopRepo as never,
      adChargeRepo as never,
    );

    await service.promoteVideo('owner-1', product.id);

    expect(adChargeRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: shop.id,
        amount: FEATURED_VIDEO_PRICE,
        productId: product.id,
        featuredVideoId: 'fv-1',
      }),
    );
  });
});
