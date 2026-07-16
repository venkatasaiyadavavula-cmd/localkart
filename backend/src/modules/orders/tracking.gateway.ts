import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { Order } from '../../core/entities/order.entity';
import { isScopedResourceAllowed } from '../../core/utils/scoped-access.util';

type TrackingJwtPayload = {
  sub: string;
  role: string;
  typ?: string;
  shopId?: string;
};

const isProduction = process.env.NODE_ENV === 'production';
export const trackingCorsOrigins = isProduction
  ? ['https://localkart.store', 'https://www.localkart.store']
  : [
      'https://localkart.store',
      'https://www.localkart.store',
      /\.vercel\.app$/,
      'http://localhost:3000',
    ];

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: trackingCorsOrigins,
    credentials: true,
  },
})
export class TrackingGateway implements OnGatewayInit {
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  afterInit() {
    this.logger.log('Tracking WebSocket gateway initialized');
  }

  @SubscribeMessage('join-order')
  async handleJoinOrder(client: Socket, payload: { orderId?: string }) {
    if (!payload?.orderId) {
      return { joined: false, error: 'orderId required' };
    }

    const token = this.extractToken(client);
    if (!token) {
      return { joined: false, error: 'Authentication required' };
    }

    let jwtPayload: TrackingJwtPayload;
    try {
      jwtPayload = this.jwtService.verify<TrackingJwtPayload>(token);
    } catch {
      return { joined: false, error: 'Invalid or expired token' };
    }

    if (jwtPayload.typ === 'refresh') {
      return { joined: false, error: 'Refresh tokens cannot be used for tracking' };
    }

    const order = await this.orderRepository.findOne({
      where: { id: payload.orderId },
      relations: ['shop'],
    });

    if (!order) {
      return { joined: false, error: 'Order not found' };
    }

    const allowed = isScopedResourceAllowed(
      {
        customerId: order.customerId,
        shopId: order.shopId,
        shopOwnerId: order.shop?.ownerId,
      },
      jwtPayload.role,
      jwtPayload.sub,
      jwtPayload.role === 'staff' ? { staffShopId: jwtPayload.shopId } : undefined,
    );

    if (!allowed) {
      this.logger.warn(
        `Tracking join denied: client=${client.id} user=${jwtPayload.sub} role=${jwtPayload.role} order=${payload.orderId}`,
      );
      return { joined: false, error: 'Access denied' };
    }

    const room = `order:${payload.orderId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { joined: true, orderId: payload.orderId };
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) {
      return fromAuth;
    }

    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }

  emitLocationUpdate(
    orderId: string,
    data: {
      latitude: number;
      longitude: number;
      updatedAt: string;
      staffName?: string;
    },
  ) {
    if (!this.server) return;
    this.server.to(`order:${orderId}`).emit('location-update', data);
  }

  emitStatusUpdate(orderId: string, data: { status: string }) {
    if (!this.server) return;
    this.server.to(`order:${orderId}`).emit('status-update', data);
  }
}
