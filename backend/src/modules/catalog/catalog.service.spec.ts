import { CatalogService } from './catalog.service';
import { ProductCategoryType, ProductStatus } from '../../core/entities/product.entity';
import { ShopStatus } from '../../core/entities/shop.entity';

describe('CatalogService.updateProduct', () => {
  const shopRepository = { findOne: jest.fn() };
  const productRepository = { findOne: jest.fn(), save: jest.fn() };
  const subscriptionRepository = { findOne: jest.fn() };
  const categoryRepository = {};
  const productVariantService = {
    listByProductId: jest.fn().mockResolvedValue([]),
    replaceVariantsForProduct: jest.fn(),
    clearVariantsForProduct: jest.fn(),
  };

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
      productVariantService as never,
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

describe('CatalogService.createProduct', () => {
  const shopRepository = { findOne: jest.fn() };
  const productRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), count: jest.fn() };
  const subscriptionRepository = { findOne: jest.fn() };
  const categoryRepository = {};
  const productVariantService = {
    listByProductId: jest.fn().mockResolvedValue([]),
    replaceVariantsForProduct: jest.fn(),
    clearVariantsForProduct: jest.fn(),
  };

  let service: CatalogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CatalogService(
      productRepository as never,
      categoryRepository as never,
      shopRepository as never,
      subscriptionRepository as never,
      productVariantService as never,
    );

    shopRepository.findOne.mockResolvedValue({
      id: 'shop-new',
      ownerId: 'seller-new',
      status: ShopStatus.APPROVED,
    });
    productRepository.count.mockResolvedValue(0);
    subscriptionRepository.findOne.mockResolvedValue(null);
    productRepository.findOne.mockImplementation(async (opts: { where: Record<string, unknown> }) => {
      if (opts?.where?.slug === 'rice') {
        return { id: 'other-prod', shopId: 'shop-old', slug: 'rice' };
      }
      if (opts?.where?.id === 'prod-new') {
        return {
          id: 'prod-new',
          shopId: 'shop-new',
          slug: 'rice-2',
          name: 'Rice',
          categoryType: ProductCategoryType.GROCERIES,
        };
      }
      return null;
    });
    productRepository.create.mockImplementation((dto) => ({ ...dto, id: 'prod-new' }));
    productRepository.save.mockImplementation(async (p) => p);
    shopRepository.findOne.mockResolvedValue({
      id: 'shop-new',
      ownerId: 'seller-new',
      status: ShopStatus.APPROVED,
    });
  });

  it('allocates a suffixed slug when the base slug is taken by another shop', async () => {
    const created = await service.createProduct('seller-new', {
      name: 'Rice',
      price: 50,
      stock: 10,
      categoryType: ProductCategoryType.GROCERIES,
      images: ['https://cdn/img.jpg'],
    });

    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'rice-2', shopId: 'shop-new' }),
    );
    expect(created.id).toBe('prod-new');
  });

  it('rejects when shop is not approved', async () => {
    shopRepository.findOne.mockResolvedValue({
      id: 'shop-pending',
      status: ShopStatus.PENDING,
    });

    await expect(
      service.createProduct('seller-new', {
        name: 'Rice',
        price: 50,
        stock: 10,
        categoryType: ProductCategoryType.GROCERIES,
      }),
    ).rejects.toMatchObject({ message: 'Your shop must be approved by admin before you can add products' });
  });
});
