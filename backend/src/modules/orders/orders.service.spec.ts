import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
import { CommissionRatesService } from '../catalog/commission-rates.service';
import { OrderStatus } from '../../core/entities/order.entity';
import { PaymentStatus } from '../../core/entities/order.entity';

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
        {
          provide: CommissionRatesService,
          useValue: {
            getRatesMap: jest.fn().mockResolvedValue({
              groceries: 2,
              fashion: 4,
              electronics: 3,
              home_essentials: 4,
              beauty: 5,
              accessories: 5,
            }),
          },
        },
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

describe('OrdersService.getUserOrders', () => {
  let service: OrdersService;
  const orderRepository = {
    findAndCount: jest.fn(),
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
        { provide: getRepositoryToken(ReturnRequest), useValue: {} },
        { provide: CartService, useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: OrderStateMachine, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: TrackingGateway, useValue: {} },
        { provide: LocationService, useValue: {} },
        {
          provide: CommissionRatesService,
          useValue: {
            getRatesMap: jest.fn().mockResolvedValue({
              groceries: 2,
              fashion: 4,
              electronics: 3,
              home_essentials: 4,
              beauty: 5,
              accessories: 5,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
    orderRepository.findAndCount.mockResolvedValue([[mockOrder()], 1]);
  });

  it('strips deliveryOtp from each order in the list', async () => {
    const result = await service.getUserOrders(OWNER_ID, 1, 20);
    expect(result.data).toHaveLength(1);
    expect((result.data[0] as Order).deliveryOtp).toBeUndefined();
  });
});

describe('OrdersService.verifyDeliveryOtp', () => {
  let service: OrdersService;
  const orderRepository = { findOne: jest.fn(), save: jest.fn() };
  const trackingGateway = { emitStatusUpdate: jest.fn() };

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
        { provide: getRepositoryToken(ReturnRequest), useValue: {} },
        { provide: CartService, useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: OrderStateMachine, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: TrackingGateway, useValue: trackingGateway },
        { provide: LocationService, useValue: {} },
        {
          provide: CommissionRatesService,
          useValue: {
            getRatesMap: jest.fn().mockResolvedValue({
              groceries: 2,
              fashion: 4,
              electronics: 3,
              home_essentials: 4,
              beauty: 5,
              accessories: 5,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
    orderRepository.findOne.mockResolvedValue(
      mockOrder({ status: OrderStatus.PENDING_OTP, deliveryOtp: '654321' }),
    );
    orderRepository.save.mockImplementation(async (o) => o);
  });

  it('strips customer.password from the returned order', async () => {
    const result = await service.verifyDeliveryOtp(
      ORDER_ID,
      '654321',
      { id: OWNER_ID, role: UserRole.CUSTOMER },
    );
    expect(result.order.customer?.password).toBeUndefined();
  });
});

describe('OrdersService.updateOrderStatusBySeller', () => {
  let service: OrdersService;
  const orderRepository = { findOne: jest.fn(), save: jest.fn() };
  const shopRepository = { findOne: jest.fn() };
  const stateMachine = { canTransition: jest.fn().mockReturnValue(true) };
  const trackingGateway = { emitStatusUpdate: jest.fn(), emitLocationUpdate: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(Shop), useValue: shopRepository },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Transaction), useValue: {} },
        { provide: getRepositoryToken(ReturnRequest), useValue: {} },
        { provide: CartService, useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: OrderStateMachine, useValue: stateMachine },
        { provide: NotificationsService, useValue: { sendOrderStatusWhatsApp: jest.fn().mockResolvedValue(undefined) } },
        { provide: TrackingGateway, useValue: trackingGateway },
        { provide: LocationService, useValue: {} },
        {
          provide: CommissionRatesService,
          useValue: {
            getRatesMap: jest.fn().mockResolvedValue({
              groceries: 2,
              fashion: 4,
              electronics: 3,
              home_essentials: 4,
              beauty: 5,
              accessories: 5,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
    shopRepository.findOne.mockResolvedValue({ id: SHOP_ID, ownerId: SELLER_ID });
    orderRepository.findOne
      .mockResolvedValueOnce(
        mockOrder({ status: OrderStatus.READY_FOR_PICKUP, deliveryOtp: undefined }),
      )
      .mockResolvedValueOnce({ customer: { phone: '+919876512345', name: 'QA' } });
    orderRepository.save.mockImplementation(async (o) => o);
    stateMachine.canTransition.mockReturnValue(true);
  });

  it('strips deliveryOtp from the returned order when marking out for delivery', async () => {
    const result = await service.updateOrderStatusBySeller(
      ORDER_ID,
      SELLER_ID,
      { status: OrderStatus.OUT_FOR_DELIVERY },
    );
    expect(result.deliveryOtp).toBeUndefined();
  });

  it('rejects delivered status — must use customer OTP verification', async () => {
    orderRepository.findOne.mockReset();
    shopRepository.findOne.mockResolvedValue({ id: SHOP_ID, ownerId: SELLER_ID });
    orderRepository.findOne.mockResolvedValue(
      mockOrder({ status: OrderStatus.OUT_FOR_DELIVERY }),
    );

    const promise = service.updateOrderStatusBySeller(
      ORDER_ID,
      SELLER_ID,
      { status: OrderStatus.DELIVERED },
    );

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow(/OTP verification/i);
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});

describe('OrdersService.adminUpdateOrderStatus', () => {
  let service: OrdersService;
  const orderRepository = { findOne: jest.fn(), save: jest.fn() };
  const stateMachine = { canTransition: jest.fn().mockReturnValue(true) };

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
        { provide: getRepositoryToken(ReturnRequest), useValue: {} },
        { provide: CartService, useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: OrderStateMachine, useValue: stateMachine },
        { provide: NotificationsService, useValue: {} },
        { provide: TrackingGateway, useValue: {} },
        { provide: LocationService, useValue: {} },
        {
          provide: CommissionRatesService,
          useValue: {
            getRatesMap: jest.fn().mockResolvedValue({
              groceries: 2,
              fashion: 4,
              electronics: 3,
              home_essentials: 4,
              beauty: 5,
              accessories: 5,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
    orderRepository.findOne.mockResolvedValue(
      mockOrder({ status: OrderStatus.OUT_FOR_DELIVERY }),
    );
    orderRepository.save.mockImplementation(async (o) => o);
    stateMachine.canTransition.mockReturnValue(true);
  });

  it('rejects delivered status — must use customer OTP verification', async () => {
    const promise = service.adminUpdateOrderStatus(ORDER_ID, { status: OrderStatus.DELIVERED });

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow(/OTP verification/i);
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});

describe('OrdersService.cancelOrder', () => {
  let service: OrdersService;
  const orderRepository = { findOne: jest.fn() };
  const stateMachine = { canTransition: jest.fn().mockReturnValue(true) };
  const trackingGateway = { emitStatusUpdate: jest.fn() };
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: { increment: jest.fn(), save: jest.fn() },
  };
  const dataSource = { createQueryRunner: jest.fn(() => queryRunner) };

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
        { provide: getRepositoryToken(ReturnRequest), useValue: {} },
        { provide: CartService, useValue: {} },
        { provide: DataSource, useValue: dataSource },
        { provide: OrderStateMachine, useValue: stateMachine },
        { provide: NotificationsService, useValue: {} },
        { provide: TrackingGateway, useValue: trackingGateway },
        { provide: LocationService, useValue: {} },
        {
          provide: CommissionRatesService,
          useValue: {
            getRatesMap: jest.fn().mockResolvedValue({
              groceries: 2,
              fashion: 4,
              electronics: 3,
              home_essentials: 4,
              beauty: 5,
              accessories: 5,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
    orderRepository.findOne.mockResolvedValue(
      mockOrder({ status: OrderStatus.CONFIRMED, deliveryOtp: '999888', items: [] }),
    );
    stateMachine.canTransition.mockReturnValue(true);
  });

  it('strips deliveryOtp from the cancelled order response', async () => {
    const result = await service.cancelOrder(ORDER_ID, OWNER_ID, 'changed mind');
    expect((result.order as Order).deliveryOtp).toBeUndefined();
  });
});

describe('OrdersService.confirmPaidOrder', () => {
  let service: OrdersService;
  const orderRepository = { findOne: jest.fn() };
  const cartService = { clearCart: jest.fn() };
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      decrement: jest.fn(),
      increment: jest.fn(),
      save: jest.fn(),
    },
  };
  const dataSource = { createQueryRunner: jest.fn(() => queryRunner) };

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
        { provide: getRepositoryToken(ReturnRequest), useValue: {} },
        { provide: CartService, useValue: cartService },
        { provide: DataSource, useValue: dataSource },
        { provide: OrderStateMachine, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: TrackingGateway, useValue: {} },
        { provide: LocationService, useValue: {} },
        {
          provide: CommissionRatesService,
          useValue: {
            getRatesMap: jest.fn().mockResolvedValue({
              groceries: 2,
              fashion: 4,
              electronics: 3,
              home_essentials: 4,
              beauty: 5,
              accessories: 5,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
  });

  it('strips deliveryOtp and customer.password when order already paid', async () => {
    orderRepository.findOne.mockResolvedValue(
      mockOrder({
        paymentStatus: PaymentStatus.PAID,
        deliveryOtp: '111222',
        customer: { password: 'hash' } as User,
      }),
    );
    const result = await service.confirmPaidOrder(ORDER_ID, 'pay_123');
    expect(result.deliveryOtp).toBeUndefined();
    expect(result.customer?.password).toBeUndefined();
  });

  it('strips deliveryOtp and customer.password after confirming payment', async () => {
    orderRepository.findOne.mockResolvedValue(
      mockOrder({
        paymentStatus: PaymentStatus.PENDING,
        deliveryOtp: '333444',
        customer: { password: 'hash' } as User,
        items: [{ productId: 'p1', quantity: 1 }] as any,
      }),
    );
    queryRunner.manager.save.mockImplementation(async (o) => o);
    const result = await service.confirmPaidOrder(ORDER_ID, 'pay_456');
    expect(result.deliveryOtp).toBeUndefined();
    expect(result.customer?.password).toBeUndefined();
  });
});
