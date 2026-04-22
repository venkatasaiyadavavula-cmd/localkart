import { ReturnReason, ReturnStatus } from '../../../core/entities/return-request.entity';
export declare class CreateReturnRequestDto {
    orderId: string;
    reason: ReturnReason;
    description?: string;
}
export declare class UpdateReturnStatusDto {
    status: ReturnStatus;
    notes?: string;
}
