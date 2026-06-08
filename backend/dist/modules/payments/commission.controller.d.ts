import { CommissionService } from './commission.service';
export declare class CommissionController {
    private readonly commissionService;
    constructor(commissionService: CommissionService);
    getMyBills(req: any, page?: string, limit?: string): Promise<{
        bills: import("../../core/entities/commission-bill.entity").CommissionBill[];
        total: number;
        totalPending: number;
        page: number;
        limit: number;
    }>;
    initiatePayment(req: any, billId: string): Promise<{
        razorpayOrderId: any;
        amount: any;
        currency: any;
        key: string;
        billDetails: {
            billDate: string;
            orderCount: number;
            commissionAmount: number;
            fineAmount: number;
            totalDue: number;
            daysOverdue: number;
        };
    }>;
    verifyPayment(req: any, billId: string, body: {
        razorpayPaymentId: string;
        razorpayOrderId: string;
        razorpaySignature: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getOverdue(): Promise<import("../../core/entities/commission-bill.entity").CommissionBill[]>;
    generateToday(): Promise<{
        success: boolean;
        message: string;
    }>;
}
