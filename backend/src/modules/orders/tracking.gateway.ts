// WebSocket tracking — @nestjs/websockets package pending install
import { Injectable } from '@nestjs/common';

@Injectable()
export class TrackingGateway {
  emitOrderUpdate(orderId: string, data: any) {
    // WebSocket emit — coming soon
    console.log('Order update:', orderId, data);
  }
}
