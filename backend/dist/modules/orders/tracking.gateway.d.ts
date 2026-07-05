import { OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class TrackingGateway implements OnGatewayInit {
    private readonly logger;
    server: Server;
    afterInit(): void;
    handleJoinOrder(client: Socket, payload: {
        orderId?: string;
    }): {
        joined: boolean;
        orderId: string;
    };
    emitLocationUpdate(orderId: string, data: {
        latitude: number;
        longitude: number;
        updatedAt: string;
        staffName?: string;
    }): void;
    emitStatusUpdate(orderId: string, data: {
        status: string;
    }): void;
}
