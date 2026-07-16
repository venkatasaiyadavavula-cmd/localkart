import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { TrackingGateway, trackingCorsOrigins } from './tracking.gateway';
import { Order } from '../../core/entities/order.entity';
import { UserRole } from '../../core/entities/user.entity';

const ORDER_ID = '05e3815a-ffea-4dfa-9428-e86562276a80';
const CUSTOMER_ID = '2ef7befb-7fbb-46b4-807f-cd72ed34648a';
const SELLER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const SHOP_ID = '2ff0ecb9-9d67-4a9d-b113-df5506f24479';
const OTHER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function mockSocket(token?: string) {
  return {
    id: 'socket-1',
    handshake: {
      auth: token ? { token } : {},
      headers: {},
    },
    join: jest.fn(),
  } as any;
}

describe('TrackingGateway.handleJoinOrder', () => {
  let gateway: TrackingGateway;
  const jwtService = { verify: jest.fn() };
  const orderRepository = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(Order), useValue: orderRepository },
      ],
    }).compile();

    gateway = module.get(TrackingGateway);
    jest.clearAllMocks();
    orderRepository.findOne.mockResolvedValue({
      id: ORDER_ID,
      customerId: CUSTOMER_ID,
      shopId: SHOP_ID,
      shop: { ownerId: SELLER_ID },
    });
  });

  it('rejects join when no token is provided', async () => {
    const result = await gateway.handleJoinOrder(mockSocket(), { orderId: ORDER_ID });
    expect(result).toEqual({ joined: false, error: 'Authentication required' });
  });

  it('rejects join when token is invalid', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const result = await gateway.handleJoinOrder(mockSocket('bad-token'), { orderId: ORDER_ID });
    expect(result).toEqual({ joined: false, error: 'Invalid or expired token' });
  });

  it('allows the customer who owns the order', async () => {
    jwtService.verify.mockReturnValue({ sub: CUSTOMER_ID, role: UserRole.CUSTOMER, typ: 'access' });
    const client = mockSocket('valid-token');
    const result = await gateway.handleJoinOrder(client, { orderId: ORDER_ID });
    expect(result).toEqual({ joined: true, orderId: ORDER_ID });
    expect(client.join).toHaveBeenCalledWith(`order:${ORDER_ID}`);
  });

  it('allows the seller who owns the shop', async () => {
    jwtService.verify.mockReturnValue({ sub: SELLER_ID, role: UserRole.SELLER, typ: 'access' });
    const client = mockSocket('valid-token');
    const result = await gateway.handleJoinOrder(client, { orderId: ORDER_ID });
    expect(result).toEqual({ joined: true, orderId: ORDER_ID });
  });

  it('allows staff assigned to the order shop', async () => {
    jwtService.verify.mockReturnValue({ sub: 'staff-1', role: 'staff', shopId: SHOP_ID, typ: 'access' });
    const client = mockSocket('valid-token');
    const result = await gateway.handleJoinOrder(client, { orderId: ORDER_ID });
    expect(result).toEqual({ joined: true, orderId: ORDER_ID });
  });

  it('allows admin', async () => {
    jwtService.verify.mockReturnValue({ sub: 'admin-1', role: UserRole.ADMIN, typ: 'access' });
    const client = mockSocket('valid-token');
    const result = await gateway.handleJoinOrder(client, { orderId: ORDER_ID });
    expect(result).toEqual({ joined: true, orderId: ORDER_ID });
  });

  it('denies a user with no relation to the order', async () => {
    jwtService.verify.mockReturnValue({ sub: OTHER_ID, role: UserRole.CUSTOMER, typ: 'access' });
    const result = await gateway.handleJoinOrder(mockSocket('valid-token'), { orderId: ORDER_ID });
    expect(result).toEqual({ joined: false, error: 'Access denied' });
  });
});

describe('trackingCorsOrigins', () => {
  it('excludes vercel.app in production', () => {
    const prod = trackingCorsOrigins.filter((o) => typeof o !== 'string' || o.includes('vercel'));
    if (process.env.NODE_ENV === 'production') {
      expect(prod).toHaveLength(0);
      expect(trackingCorsOrigins).toEqual([
        'https://localkart.store',
        'https://www.localkart.store',
      ]);
    }
  });

  it('includes vercel.app only outside production', () => {
    if (process.env.NODE_ENV !== 'production') {
      const hasVercel = trackingCorsOrigins.some(
        (o) => o instanceof RegExp && o.test('https://foo.vercel.app'),
      );
      expect(hasVercel).toBe(true);
    }
  });
});
