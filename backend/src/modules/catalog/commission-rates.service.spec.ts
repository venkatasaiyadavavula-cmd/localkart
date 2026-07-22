import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommissionRatesService } from './commission-rates.service';
import { ProductCategoryType } from '../../core/entities/product.entity';
import { CommissionService } from '../admin/commission.service';

describe('CommissionRatesService', () => {
  const categories = [
    { id: '1', slug: 'groceries', name: 'Groceries', commissionRate: 2 },
    { id: '2', slug: 'fashion', name: 'Fashion', commissionRate: 4 },
    { id: '3', slug: 'electronics', name: 'Electronics', commissionRate: 3 },
    { id: '4', slug: 'home-essentials', name: 'Home Essentials', commissionRate: 4 },
    { id: '5', slug: 'beauty', name: 'Beauty', commissionRate: 5 },
    { id: '6', slug: 'accessories', name: 'Accessories', commissionRate: 5 },
  ];

  let categoryRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let service: CommissionRatesService;

  beforeEach(() => {
    categoryRepository = {
      find: jest.fn().mockResolvedValue(categories),
      findOne: jest.fn(async ({ where: { slug } }: { where: { slug: string } }) =>
        categories.find((c) => c.slug === slug) ?? null,
      ),
      save: jest.fn(async (cat) => {
        const idx = categories.findIndex((c) => c.slug === cat.slug);
        if (idx >= 0) categories[idx] = { ...categories[idx], ...cat };
        return cat;
      }),
    };
    service = new CommissionRatesService(categoryRepository as any);
  });

  it('loads rates from Category.commissionRate by slug', async () => {
    const map = await service.getRatesMap();
    expect(map[ProductCategoryType.GROCERIES]).toBe(2);
    expect(map[ProductCategoryType.HOME_ESSENTIALS]).toBe(4);
  });

  it('persists admin rate updates to the category row', async () => {
    await service.updateCategoryRate(ProductCategoryType.GROCERIES, 7);
    expect(categoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'groceries', commissionRate: 7 }),
    );
    const map = await service.getRatesMap();
    expect(map[ProductCategoryType.GROCERIES]).toBe(7);
  });

  it('rejects invalid rates', async () => {
    await expect(service.updateCategoryRate(ProductCategoryType.BEAUTY, 150)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when category row is missing', async () => {
    categoryRepository.findOne.mockResolvedValueOnce(null);
    await expect(
      service.updateCategoryRate(ProductCategoryType.GROCERIES, 5),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('Commission rate admin → order charge', () => {
  it('uses the same CommissionRatesService so admin updates affect order commission %', async () => {
    const categories = [
      { id: '1', slug: 'groceries', name: 'Groceries', commissionRate: 2 },
    ];
    const categoryRepository = {
      find: jest.fn().mockImplementation(async () => categories),
      findOne: jest.fn(async ({ where: { slug } }: { where: { slug: string } }) =>
        categories.find((c) => c.slug === slug) ?? null,
      ),
      save: jest.fn(async (cat) => {
        categories[0] = { ...categories[0], ...cat };
        return categories[0];
      }),
    };

    const ratesService = new CommissionRatesService(categoryRepository as any);

    const adminCommission = new CommissionService(
      {} as any,
      {} as any,
      {} as any,
      ratesService,
    );

    await adminCommission.updateCategoryCommission('groceries', 9);

    const ratesMap = await ratesService.getRatesMap();
    const subtotal = 1000;
    const commissionRate = Math.max(ratesMap[ProductCategoryType.GROCERIES]);
    const commissionAmount = (subtotal * commissionRate) / 100;

    expect(commissionRate).toBe(9);
    expect(commissionAmount).toBe(90);

    // OrdersService path: same map lookup as createOrder
    const product = { categoryType: ProductCategoryType.GROCERIES } as any;
    const itemRate = ratesMap[product.categoryType];
    expect((500 * itemRate) / 100).toBe(45);
  });
});
