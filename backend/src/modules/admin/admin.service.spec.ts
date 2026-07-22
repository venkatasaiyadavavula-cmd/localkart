import { AdminService } from './admin.service';
import { OrderStatus } from '../../core/entities/order.entity';
import { ShopStatus } from '../../core/entities/shop.entity';
import { ProductStatus } from '../../core/entities/product.entity';
import { UserRole } from '../../core/entities/user.entity';
import { ReturnStatus } from '../../core/entities/return-request.entity';
import * as dashboardUtil from './admin-dashboard.util';

describe('AdminService dashboard', () => {
  const fixedNow = new Date('2026-07-22T12:00:00.000Z');
  const ranges = dashboardUtil.getPeriodRanges('week', fixedNow);

  let shopRepository: {
    count: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let productRepository: { count: jest.Mock; find: jest.Mock };
  let orderRepository: {
    createQueryBuilder: jest.Mock;
    find: jest.Mock;
  };
  let userRepository: { count: jest.Mock; createQueryBuilder: jest.Mock };
  let returnRequestRepository: { count: jest.Mock; find: jest.Mock };
  let service: AdminService;

  const makeRangeQueryBuilder = (count: number) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
  });

  const makeRevenueQueryBuilder = (revenue: number, commission: number) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({
      revenue: String(revenue),
      commission: String(commission),
    }),
  });

  beforeEach(() => {
    jest.spyOn(dashboardUtil, 'getPeriodRanges').mockReturnValue(ranges);

    shopRepository = {
      count: jest.fn(async ({ where }) => {
        if (where?.status === ShopStatus.APPROVED) return 12;
        if (where?.status === ShopStatus.PENDING) return 3;
        return 0;
      }),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(makeRangeQueryBuilder(4))
        .mockReturnValueOnce(makeRangeQueryBuilder(2)),
    };

    productRepository = {
      count: jest.fn().mockResolvedValue(5),
      find: jest.fn().mockResolvedValue([]),
    };

    orderRepository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(makeRevenueQueryBuilder(1000, 100))
        .mockReturnValueOnce(makeRevenueQueryBuilder(500, 50))
        .mockReturnValueOnce(makeRangeQueryBuilder(20))
        .mockReturnValueOnce(makeRangeQueryBuilder(10)),
      find: jest.fn().mockResolvedValue([]),
    };

    userRepository = {
      count: jest.fn().mockResolvedValue(200),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(makeRangeQueryBuilder(8))
        .mockReturnValueOnce(makeRangeQueryBuilder(4)),
    };

    returnRequestRepository = {
      count: jest.fn().mockResolvedValue(2),
      find: jest.fn().mockResolvedValue([]),
    };

    service = new AdminService(
      shopRepository as any,
      productRepository as any,
      orderRepository as any,
      userRepository as any,
      returnRequestRepository as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns period-scoped revenue/orders and trend percentages', async () => {
    const stats = await service.getDashboardStats('week');

    expect(stats.period).toBe('week');
    expect(stats.totalRevenue).toBe(1000);
    expect(stats.totalOrders).toBe(20);
    expect(stats.revenueChange).toBe(100);
    expect(stats.ordersChange).toBe(100);
    expect(stats.shopsChange).toBe(100);
    expect(stats.customersChange).toBe(100);
  });

  it('uses approved shops for activeShops and pending return count for disputes', async () => {
    const stats = await service.getDashboardStats('week');

    expect(stats.activeShops).toBe(12);
    expect(shopRepository.count).toHaveBeenCalledWith({
      where: { status: ShopStatus.APPROVED },
    });
    expect(stats.openDisputes).toBe(2);
    expect(returnRequestRepository.count).toHaveBeenCalledWith({
      where: { status: ReturnStatus.PENDING },
    });
    expect(stats.pendingShops).toBe(3);
    expect(stats.pendingProducts).toBe(5);
    expect(stats.totalCustomers).toBe(200);
    expect(userRepository.count).toHaveBeenCalledWith({
      where: { role: UserRole.CUSTOMER },
    });
  });

  it('builds revenue chart from deliveredAt for delivered orders', async () => {
    const chartQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          date: '2026-07-20T00:00:00.000Z',
          revenue: '250.50',
          commission: '12.50',
        },
      ]),
    };

    orderRepository.createQueryBuilder = jest
      .fn()
      .mockReturnValue(chartQueryBuilder);

    const chart = await service.getRevenueChart('week');

    expect(chartQueryBuilder.where).toHaveBeenCalledWith(
      'order.status = :status',
      { status: OrderStatus.DELIVERED },
    );
    expect(chartQueryBuilder.andWhere).toHaveBeenCalledWith(
      'order.deliveredAt IS NOT NULL',
    );
    expect(chartQueryBuilder.andWhere).toHaveBeenCalledWith(
      'order.deliveredAt >= :start',
      { start: ranges.current.start },
    );
    expect(chart).toEqual([
      {
        date: '2026-07-20T00:00:00.000Z',
        revenue: 250.5,
        commission: 12.5,
      },
    ]);
  });

  it('merges and sorts recent activity from multiple sources', async () => {
    orderRepository.find.mockResolvedValue([
      {
        id: 'o1',
        orderNumber: 'LK-100',
        createdAt: new Date('2026-07-22T10:00:00.000Z'),
      },
    ]);
    shopRepository.find.mockResolvedValue([
      {
        id: 's1',
        name: 'Fresh Mart',
        createdAt: new Date('2026-07-22T11:00:00.000Z'),
      },
    ]);
    productRepository.find.mockResolvedValue([
      {
        id: 'p1',
        name: 'Rice 5kg',
        createdAt: new Date('2026-07-21T09:00:00.000Z'),
      },
    ]);
    returnRequestRepository.find.mockResolvedValue([
      {
        id: 'r1',
        orderId: 'o9',
        order: { orderNumber: 'LK-200' },
        createdAt: new Date('2026-07-22T09:30:00.000Z'),
      },
    ]);

    const stats = await service.getDashboardStats('week');

    expect(stats.recentActivity).toHaveLength(4);
    expect(stats.recentActivity[0].description).toContain('Fresh Mart');
    expect(stats.recentActivity[1].description).toContain('LK-100');
    expect(stats.recentActivity[2].description).toContain('LK-200');
  });
});
