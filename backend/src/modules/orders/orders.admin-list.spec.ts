import { OrdersService } from './orders.service';
import { OrderStatus } from '../../core/entities/order.entity';

describe('OrdersService.getAllOrders (admin)', () => {
  let service: OrdersService;
  let orderRepository: { createQueryBuilder: jest.Mock };

  const makeOrdersQueryBuilder = (orders: object[], total: number) => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([orders, total]),
    };
    return qb;
  };

  beforeEach(() => {
    orderRepository = { createQueryBuilder: jest.fn() };

    service = new OrdersService(
      orderRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { canTransition: jest.fn() } as any,
      { getRatesMap: jest.fn() } as any,
    );
  });

  it('applies status, search, and date filters', async () => {
    const qb = makeOrdersQueryBuilder(
      [
        {
          id: 'o1',
          orderNumber: 'LK-100',
          status: OrderStatus.CONFIRMED,
          customer: { password: 'x' },
          deliveryOtp: '9999',
        },
      ],
      1,
    );
    orderRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getAllOrders(1, 20, {
      status: OrderStatus.CONFIRMED,
      shopSearch: 'Fresh',
      customerSearch: '9000',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      customerId: 'c1',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('order.status = :status', {
      status: OrderStatus.CONFIRMED,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'order.customerId = :customerId',
      { customerId: 'c1' },
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].customer?.password).toBeUndefined();
    expect(result.data[0].deliveryOtp).toBeUndefined();
    expect(result.meta.total).toBe(1);
  });
});
