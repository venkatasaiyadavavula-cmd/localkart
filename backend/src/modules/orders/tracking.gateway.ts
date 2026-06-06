import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody,
  ConnectedSocket, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Order } from '../../core/entities/order.entity';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Customer joins order room to receive live updates
  @SubscribeMessage('join-order')
  async handleJoinOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `order:${data.orderId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);

    // Send current location if available
    const order = await this.orderRepo.findOne({ where: { id: data.orderId } });
    if (order?.deliveryLatitude && order?.deliveryLongitude) {
      client.emit('location-update', {
        orderId:   data.orderId,
        latitude:  Number(order.deliveryLatitude),
        longitude: Number(order.deliveryLongitude),
        updatedAt: order.locationUpdatedAt,
        staffName: order.deliveryStaffName,
      });
    }
  }

  // Delivery staff sends their GPS location
  @SubscribeMessage('update-location')
  async handleLocationUpdate(
    @MessageBody() data: {
      orderId:   string;
      latitude:  number;
      longitude: number;
      staffName?: string;
      staffPhone?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const order = await this.orderRepo.findOne({ where: { id: data.orderId } });
    if (!order) return;

    // Persist to DB
    await this.orderRepo.update(data.orderId, {
      deliveryLatitude:  data.latitude,
      deliveryLongitude: data.longitude,
      locationUpdatedAt: new Date(),
      deliveryStaffName: data.staffName ?? order.deliveryStaffName,
      deliveryStaffPhone: data.staffPhone ?? order.deliveryStaffPhone,
    });

    // Broadcast to all customers watching this order
    this.server.to(`order:${data.orderId}`).emit('location-update', {
      orderId:   data.orderId,
      latitude:  data.latitude,
      longitude: data.longitude,
      updatedAt: new Date(),
      staffName: data.staffName ?? order.deliveryStaffName,
    });

    this.logger.log(`Location updated: order=${data.orderId} lat=${data.latitude} lng=${data.longitude}`);
  }

  // Helper: broadcast from REST API (when status changes)
  broadcastStatusChange(orderId: string, status: string) {
    this.server.to(`order:${orderId}`).emit('status-update', { orderId, status });
  }
}
