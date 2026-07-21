import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { SellerService } from './seller.service';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Product } from '../../core/entities/product.entity';
import { Order } from '../../core/entities/order.entity';

describe('SellerService shop location', () => {
  let service: SellerService;

  const execute = jest.fn().mockResolvedValue({ affected: 1 });
  const queryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute,
  };

  const shopRepository = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'shop-1', ...data })),
    save: jest.fn(async (shop) => shop),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };

  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerService,
        { provide: getRepositoryToken(Shop), useValue: shopRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(Order), useValue: {} },
      ],
    }).compile();

    service = module.get(SellerService);
    jest.clearAllMocks();
  });

  const profile = {
    name: 'Test Shop',
    address: '123 Main St',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    pincode: '516001',
    contactPhone: '+919876543210',
    latitude: 14.4673,
    longitude: 78.8242,
  };

  it('createShop sets location via query builder, not repository.create()', async () => {
    shopRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    userRepository.findOne.mockResolvedValue({ id: 'owner-1', role: 'seller' });

    await service.createShop('owner-1', profile as any);

    const createArg = shopRepository.create.mock.calls[0][0];
    expect(createArg.location).toBeUndefined();
    expect(shopRepository.createQueryBuilder).toHaveBeenCalled();
    expect(queryBuilder.set).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: profile.latitude,
        longitude: profile.longitude,
        location: expect.any(Function),
      }),
    );
    expect(queryBuilder.set.mock.calls[0][0].location()).toBe(
      `ST_SetSRID(ST_MakePoint(${profile.longitude}, ${profile.latitude}), 4326)`,
    );
    expect(execute).toHaveBeenCalled();
  });

  it('updateShop sets location via query builder when coordinates provided', async () => {
    shopRepository.findOne.mockResolvedValue({
      id: 'shop-1',
      ownerId: 'owner-1',
      status: ShopStatus.APPROVED,
    });

    await service.updateShop('owner-1', profile as any);

    expect(shopRepository.createQueryBuilder).toHaveBeenCalled();
    expect(queryBuilder.where).toHaveBeenCalledWith('id = :id', { id: 'shop-1' });
    expect(execute).toHaveBeenCalled();
  });

  it('createShop rejects duplicate shop', async () => {
    shopRepository.findOne.mockResolvedValue({ id: 'existing' });

    await expect(service.createShop('owner-1', profile as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(shopRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
