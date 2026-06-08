import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { Order } from '../../core/entities/order.entity';
export declare class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly orderRepo;
    server: Server;
    private readonly logger;
    constructor(orderRepo: Repository<Order>);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinOrder(data: {
        orderId: string;
    }, client: Socket): Promise<void>;
    handleLocationUpdate(data: {
        orderId: string;
        latitude: number;
        longitude: number;
        staffName?: string;
        staffPhone?: string;
    }, client: Socket): Promise<void>;
    broadcastStatusChange(orderId: string, status: string): void;
}
