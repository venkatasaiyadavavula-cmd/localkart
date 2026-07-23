import { AdminService } from './admin.service';
import { UserRole } from '../../core/entities/user.entity';

describe('AdminService.listCustomers', () => {
  let userRepository: { createQueryBuilder: jest.Mock };
  let orderRepository: { createQueryBuilder: jest.Mock };
  let service: AdminService;

  const makeUserQueryBuilder = (users: object[], total: number) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([users, total]),
  });

  const makeOrderStatsQueryBuilder = (
    rows: Array<{ customerId: string; totalOrders: string; totalSpent: string }>,
  ) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  });

  beforeEach(() => {
    userRepository = { createQueryBuilder: jest.fn() };
    orderRepository = { createQueryBuilder: jest.fn() };

    service = new AdminService(
      { count: jest.fn(), find: jest.fn(), createQueryBuilder: jest.fn() } as any,
      { count: jest.fn(), find: jest.fn() } as any,
      orderRepository as any,
      userRepository as any,
      { count: jest.fn(), find: jest.fn() } as any,
    );
  });

  it('returns paginated customers with order stats', async () => {
    const users = [
      {
        id: 'c1',
        name: 'Alice',
        phone: '9000000001',
        email: 'alice@example.com',
        role: UserRole.CUSTOMER,
        isActive: true,
        password: 'secret',
        lastOtp: '1234',
        createdAt: new Date('2026-07-01'),
      },
    ];

    userRepository.createQueryBuilder.mockReturnValue(
      makeUserQueryBuilder(users, 1),
    );
    orderRepository.createQueryBuilder.mockReturnValue(
      makeOrderStatsQueryBuilder([
        { customerId: 'c1', totalOrders: '3', totalSpent: '1500.50' },
      ]),
    );

    const result = await service.listCustomers({ page: 1, limit: 20, search: 'ali' });

    expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'c1',
      name: 'Alice',
      totalOrders: 3,
      totalSpent: 1500.5,
    });
    expect(result.data[0]).not.toHaveProperty('password');
    expect(result.data[0]).not.toHaveProperty('lastOtp');
  });
});
