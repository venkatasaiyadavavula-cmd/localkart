import { CatalogService } from './catalog.service';
import { ProductStatus } from '../../core/entities/product.entity';
import { ShopStatus } from '../../core/entities/shop.entity';

describe('CatalogService.updateProduct videos', () => {
  const shopRepository = { findOne: jest.fn() };
  const productRepository = { findOne: jest.fn(), save: jest.fn() };
  const subscriptionRepository = { findOne: jest.fn() };
  const categoryRepository = {};
  const productRepoForMedia = {};

  let service: CatalogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CatalogService(
      productRepository as never,
      categoryRepository as never,
      shopRepository as never,
      subscriptionRepository as never,
    );
  });

  it('persists videos array on seller product update', async () => {
    const product = {
      id: 'prod-1',
      shopId: 'shop-1',
      name: 'Rice 1kg',
      slug: 'rice-1kg',
      status: ProductStatus.APPROVED,
      videos: [],
    };

    shopRepository.findOne.mockResolvedValue({
      id: 'shop-1',
      ownerId: 'seller-1',
      status: ShopStatus.APPROVED,
    });
    productRepository.findOne.mockResolvedValue({ ...product });
    productRepository.save.mockImplementation(async (p) => p);

    const videoUrl = 'https://example.test/videos/shop-1/test.mp4';
    const updated = await service.updateProduct('seller-1', 'prod-1', {
      videos: [videoUrl],
    });

    expect(updated.videos).toEqual([videoUrl]);
    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        videos: [videoUrl],
        status: ProductStatus.PENDING,
      }),
    );
  });
});
