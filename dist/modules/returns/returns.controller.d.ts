import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto, UpdateReturnStatusDto } from './dto/return-request.dto';
export declare class ReturnsController {
    private readonly returnsService;
    constructor(returnsService: ReturnsService);
    createReturnRequest(user: any, dto: CreateReturnRequestDto, files: Express.Multer.File[]): Promise<import("../../core/entities/return-request.entity").ReturnRequest>;
    getMyReturnRequests(user: any, page?: string, limit?: string): Promise<{
        data: import("../../core/entities/return-request.entity").ReturnRequest[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getReturnRequestById(user: any, id: string): Promise<import("../../core/entities/return-request.entity").ReturnRequest>;
    cancelReturnRequest(user: any, id: string): Promise<{
        message: string;
    }>;
    getSellerPendingReturns(user: any): Promise<import("../../core/entities/return-request.entity").ReturnRequest[]>;
    approveReturnRequest(user: any, id: string): Promise<import("../../core/entities/return-request.entity").ReturnRequest>;
    rejectReturnRequest(user: any, id: string, reason: string): Promise<import("../../core/entities/return-request.entity").ReturnRequest>;
    schedulePickup(user: any, id: string, body: {
        pickupDate: string;
        pickupAddress: string;
        contactPhone: string;
    }): Promise<import("../../core/entities/return-request.entity").ReturnRequest>;
    confirmPickup(user: any, id: string): Promise<import("../../core/entities/return-request.entity").ReturnRequest>;
    getAllReturnRequests(page?: string, limit?: string, status?: string): Promise<{
        data: import("../../core/entities/return-request.entity").ReturnRequest[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    adminUpdateReturnStatus(id: string, dto: UpdateReturnStatusDto): Promise<import("../../core/entities/return-request.entity").ReturnRequest>;
    processRefund(id: string): Promise<{
        message: string;
    }>;
}
