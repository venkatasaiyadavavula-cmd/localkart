import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createRazorpayOrder(user: any, createPaymentDto: CreatePaymentDto): Promise<{
        orderId: string;
        amount: string | number;
        currency: string;
        key: string | undefined;
    }>;
    verifyPayment(user: any, verifyPaymentDto: VerifyPaymentDto): Promise<{
        success: boolean;
        message: string;
    }>;
    initiateCodOrder(user: any, createPaymentDto: CreatePaymentDto): Promise<{
        message: string;
    }>;
}
