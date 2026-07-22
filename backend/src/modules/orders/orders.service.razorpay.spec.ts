import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, PaymentStatus } from '../../core/entities/order.entity';
import { OrderItem } from '../../core/entities/order-item.entity';
import { Product } from '../../core/entities/product.entity';
import { Shop } from '../../core/entities/shop.entity';
import { User } from '../../core/entities/user.entity';
import { Transaction, TransactionStatus, TransactionType } from '../../core/entities/transaction.entity';
import { ReturnRequest } from '../../core/entities/return-request.entity';
import { CartService } from '../cart/cart.service';
import { OrderStateMachine } from './workflows/order-state-machine';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingGateway } from './tracking.gateway';
import { LocationService } from '../location/location.service';
import { CommissionRatesService } from '../catalog/commission-rates.service';

const ORDER_ID = '05e3815a-ffea-4dfa-9428-e86562276a80';
const RAZORPAY_ORDER_ID = 'order_MxTestRzpOrderId123';

describe('OrdersService.updateRazorpayOrderId', () => {
  let service: OrdersService;
  const orderRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const transactionRepository = {
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn(async (txn) => txn),
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
        { provide: getRepositoryToken(Transaction), useValue: transactionRepository },
        { provide: getRepositoryToken(ReturnRequest), useValue: {} },
        { provide: CartService, useValue: {} },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
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

  it('persists razorpayOrderId on the order row and creates a pending transaction', async () => {
    orderRepository.findOne.mockResolvedValue({
      id: ORDER_ID,
      totalAmount: 500,
      razorpayOrderId: null,
    });

    await service.updateRazorpayOrderId(ORDER_ID, RAZORPAY_ORDER_ID);

    expect(orderRepository.update).toHaveBeenCalledWith(
      { id: ORDER_ID },
      {
        paymentStatus: PaymentStatus.PENDING,
        razorpayOrderId: RAZORPAY_ORDER_ID,
      },
    );
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        razorpayOrderId: RAZORPAY_ORDER_ID,
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        amount: 500,
      }),
    );
    expect(transactionRepository.save).toHaveBeenCalled();
  });

  it('is idempotent when the same razorpayOrderId is already linked', async () => {
    orderRepository.findOne.mockResolvedValue({
      id: ORDER_ID,
      totalAmount: 500,
      razorpayOrderId: RAZORPAY_ORDER_ID,
    });
    transactionRepository.findOne.mockResolvedValue({
      orderId: ORDER_ID,
      razorpayOrderId: RAZORPAY_ORDER_ID,
      status: TransactionStatus.PENDING,
    });

    await service.updateRazorpayOrderId(ORDER_ID, RAZORPAY_ORDER_ID);

    expect(orderRepository.update).not.toHaveBeenCalled();
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });
});
