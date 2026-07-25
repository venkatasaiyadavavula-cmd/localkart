import { CatalogService } from './catalog.service';
import { ProductCategoryType, ProductStatus } from '../../core/entities/product.entity';
import { ShopStatus } from '../../core/entities/shop.entity';

describe('CatalogService.updateProduct', () => {
  const shopRepository = { findOne: jest.fn() };
  const productRepository = { findOne: jest.fn(), save: jest.fn() };
  const subscriptionRepository = { findOne: jest.fn() };
  const categoryRepository = {};

  let service: CatalogService;

  const approvedProduct = {
    id: 'prod-1',
    shopId: 'shop-1',
    name: 'Rice 1kg',
    slug: 'rice-1kg',
    description: 'Good rice',
    price: 100,
    mrp: 120,
    stock: 10,
    categoryType: ProductCategoryType.GROCERIES,
    status: ProductStatus.APPROVED,
    images: ['https://cdn/img1.jpg'],
    videos: [] as string[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CatalogService(
      productRepository as never,
      categoryRepository as never,
      shopRepository as never,
      subscriptionRepository as never,
    );

    shopRepository.findOne.mockResolvedValue({
      id: 'shop-1',
      ownerId: 'seller-1',
      status: ShopStatus.APPROVED,
    });
    productRepository.save.mockImplementation(async (p) => p);
  });

  it('keeps approved status on videos-only update', async () => {
    productRepository.findOne.mockResolvedValue({ ...approvedProduct });

    const videoUrl = 'https://example.test/videos/shop-1/test.mp4';
    const updated = await service.updateProduct('seller-1', 'prod-1', {
      videos: [videoUrl],
    });

    expect(updated.videos).toEqual([videoUrl]);
    expect(updated.status).toBe(ProductStatus.APPROVED);
    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ProductStatus.APPROVED,
        videos: [videoUrl],
      }),
    );
  });

  it('keeps pending status on videos-only update', async () => {
    productRepository.findOne.mockResolvedValue({
      ...approvedProduct,
      status: ProductStatus.PENDING,
    });

    const updated = await service.updateProduct('seller-1', 'prod-1', {
      videos: ['https://example.test/v.mp4'],
    });

    expect(updated.status).toBe(ProductStatus.PENDING);
  });

  it('resets approved product to pending when price changes', async () => {
    productRepository.findOne.mockResolvedValue({ ...approvedProduct });

    const updated = await service.updateProduct('seller-1', 'prod-1', {
      price: 90,
    });

    expect(updated.status).toBe(ProductStatus.PENDING);
    expect(Number(updated.price)).toBe(90);
  });

  it('resets approved product to pending when videos and price change together', async () => {
    productRepository.findOne.mockResolvedValue({ ...approvedProduct });

    const updated = await service.updateProduct('seller-1', 'prod-1', {
      videos: ['https://example.test/v.mp4'],
      price: 85,
    });

    expect(updated.status).toBe(ProductStatus.PENDING);
    expect(updated.videos).toEqual(['https://example.test/v.mp4']);
  });

  it('does not reset when full edit payload matches existing catalog fields (videos added)', async () => {
    productRepository.findOne.mockResolvedValue({ ...approvedProduct });

    const updated = await service.updateProduct('seller-1', 'prod-1', {
      name: approvedProduct.name,
      description: approvedProduct.description,
      price: approvedProduct.price,
      mrp: approvedProduct.mrp,
      stock: approvedProduct.stock,
      categoryType: approvedProduct.categoryType,
      images: [...approvedProduct.images],
      videos: ['https://example.test/v.mp4'],
    });

    expect(updated.status).toBe(ProductStatus.APPROVED);
  });
});
