import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: [
      'https://localkart.store',
      'https://www.localkart.store',
      /\.vercel\.app$/,
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
export class TrackingGateway implements OnGatewayInit {
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('Tracking WebSocket gateway initialized');
  }

  @SubscribeMessage('join-order')
  handleJoinOrder(client: Socket, payload: { orderId?: string }) {
    if (!payload?.orderId) return;
    const room = `order:${payload.orderId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { joined: true, orderId: payload.orderId };
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
