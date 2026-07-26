import { BadRequestException } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';

describe('ProductVariantService', () => {
  const variantRepo = {
    delete: jest.fn(),
    create: jest.fn((row) => row),
    save: jest.fn(async (rows) => rows),
  };
  const productRepo = { update: jest.fn() };

  let service: ProductVariantService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductVariantService(variantRepo as never, productRepo as never);
  });

  it('rejects negative stock', () => {
    expect(() =>
      service.validateVariants([{ attributes: { color: 'Red', size: 'M' }, stock: -1 }]),
    ).toThrow(BadRequestException);
  });

  it('rejects duplicate combinations', () => {
    expect(() =>
      service.validateVariants([
        { attributes: { color: 'Red', size: 'M' }, stock: 1 },
        { attributes: { color: 'Red', size: 'M' }, stock: 2 },
      ]),
    ).toThrow(/Duplicate/);
  });

  it('syncs product stock from variant totals', async () => {
    await service.replaceVariantsForProduct('prod-1', [
      { attributes: { color: 'Red', size: 'S' }, stock: 3 },
      { attributes: { color: 'Blue', size: 'L' }, stock: 7 },
    ]);

    expect(variantRepo.delete).toHaveBeenCalledWith({ productId: 'prod-1' });
    expect(productRepo.update).toHaveBeenCalledWith('prod-1', {
      hasVariants: true,
      stock: 10,
    });
  });
});
