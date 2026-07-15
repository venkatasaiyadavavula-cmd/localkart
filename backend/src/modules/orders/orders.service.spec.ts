import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from '../../core/entities/order.entity';
import { OrderItem } from '../../core/entities/order-item.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { User, UserRole } from '../../core/entities/user.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { ReturnRequest } from '../../core/entities/return-request.entity';
import { CartService } from '../cart/cart.service';
import { OrderStateMachine } from './workflows/order-state-machine';
import { TrackingGateway } from './tracking.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { LocationService } from '../location/location.service';

const ORDER_ID = '05e3815a-ffea-4dfa-9428-e86562276a80';
const OWNER_ID = '2ef7befb-7fbb-46b4-807f-cd72ed34648a';
const OTHER_CUSTOMER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const SHOP_ID = '2ff0ecb9-9d67-4a9d-b113-df5506f24479';
const SELLER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function mockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: ORDER_ID,
    customerId: OWNER_ID,
    shopId: SHOP_ID,
    shop: { ownerId: SELLER_ID } as Shop,
    customer: { password: 'secret' } as User,
    items: [],
    deliveryOtp: '1234',
    ...overrides,
  } as Order;
}

describe('OrdersService.getOrderById', () => {
  let service: OrdersService;
  const orderRepository = {
    findOne: jest.fn(),
  };
  const returnRepository = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(Shop), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Transaction), useValue: {} },
        { provide: getRepositoryToken(ReturnRequest), useValue: returnRepository },
        { provide: CartService, useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: OrderStateMachine, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: TrackingGateway, useValue: {} },
        { provide: LocationService, useValue: {} },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
    orderRepository.findOne.mockResolvedValue(mockOrder());
    returnRepository.findOne.mockResolvedValue(null);
  });

  it('returns 200-equivalent data when customer fetches their own order', async () => {
    const result = await service.getOrderById(ORDER_ID, OWNER_ID, UserRole.CUSTOMER);
    expect(result.id).toBe(ORDER_ID);
    expect((result as Order).deliveryOtp).toBeUndefined();
  });

  it('throws ForbiddenException when a different customer fetches the order', async () => {
    await expect(
      service.getOrderById(ORDER_ID, OTHER_CUSTOMER_ID, UserRole.CUSTOMER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows the seller who owns the shop', async () => {
    const result = await service.getOrderById(ORDER_ID, SELLER_ID, UserRole.SELLER);
    expect(result.id).toBe(ORDER_ID);
  });

  it('allows staff assigned to the order shop', async () => {
    const result = await service.getOrderById(ORDER_ID, 'staff-1', 'staff', SHOP_ID);
    expect(result.id).toBe(ORDER_ID);
  });

  it('allows admin', async () => {
    const result = await service.getOrderById(ORDER_ID, 'admin-1', UserRole.ADMIN);
    expect(result.id).toBe(ORDER_ID);
  });

  it('throws NotFoundException for invalid uuid', async () => {
    await expect(
      service.getOrderById('not-a-uuid', OWNER_ID, UserRole.CUSTOMER),
    ).rejects.toThrow(NotFoundException);
  });
});
