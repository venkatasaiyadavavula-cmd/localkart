import { StaffWorkService } from './staff-work.service';
import { CatalogService } from '../catalog/catalog.service';
import { OrdersService } from '../orders/orders.service';
import { ProductStatus } from '../../core/entities/product.entity';

describe('StaffWorkService.updateProduct', () => {
  it('delegates to CatalogService.updateProduct (shared re-approval rules)', async () => {
    const shopRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'shop-1', ownerId: 'owner-1' }),
    };
    const catalogService = {
      updateProduct: jest.fn().mockResolvedValue({
        id: 'prod-1',
        status: ProductStatus.APPROVED,
        videos: ['https://cdn/v.mp4'],
      }),
    };
    const ordersService = {};

    const service = new StaffWorkService(
      shopRepo as never,
      catalogService as unknown as CatalogService,
      ordersService as never,
    );

    const staffUser = { shopId: 'shop-1' };
    const dto = { videos: ['https://cdn/v.mp4'] };

    const result = await service.updateProduct(staffUser, 'prod-1', dto);

    expect(catalogService.updateProduct).toHaveBeenCalledWith('owner-1', 'prod-1', dto);
    expect(result.status).toBe(ProductStatus.APPROVED);
  });
});

describe('StaffWorkService.createProduct', () => {
  it('passes images and variants through to CatalogService.createProduct', async () => {
    const shopRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'shop-1', ownerId: 'owner-1' }),
    };
    const catalogService = {
      createProduct: jest.fn().mockResolvedValue({ id: 'prod-new' }),
    };
    const ordersService = {};

    const service = new StaffWorkService(
      shopRepo as never,
      catalogService as unknown as CatalogService,
      ordersService as never,
    );

    const dto = {
      name: 'Staff Tee',
      price: 499,
      stock: 10,
      categoryType: 'fashion',
      images: ['https://cdn/img.jpg'],
      variants: [{ color: 'Red', size: 'M', stock: 5, price: 499 }],
    };

    await service.createProduct({ shopId: 'shop-1' }, dto as never);

    expect(catalogService.createProduct).toHaveBeenCalledWith('owner-1', dto);
  });
});

describe('StaffWorkService.verifyOrderOtp', () => {
  it('delegates to OrdersService with staff role and shopId', async () => {
    const shopRepo = { findOne: jest.fn() };
    const catalogService = {};
    const ordersService = {
      verifyDeliveryOtp: jest.fn().mockResolvedValue({ message: 'ok' }),
    };

    const service = new StaffWorkService(
      shopRepo as never,
      catalogService as unknown as CatalogService,
      ordersService as unknown as OrdersService,
    );

    const staffUser = { id: 'staff-1', shopId: 'shop-1' };
    await service.verifyOrderOtp(staffUser, 'order-1', '123456');

    expect(ordersService.verifyDeliveryOtp).toHaveBeenCalledWith('order-1', '123456', {
      id: 'staff-1',
      role: 'staff',
      shopId: 'shop-1',
    });
  });
});
