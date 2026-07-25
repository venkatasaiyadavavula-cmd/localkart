import { StaffWorkService } from './staff-work.service';
import { CatalogService } from '../catalog/catalog.service';
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
