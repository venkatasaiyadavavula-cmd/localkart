import { Repository } from 'typeorm';
import { Order } from '../../core/entities/order.entity';
import { Transaction } from '../../core/entities/transaction.entity';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsService {
    private readonly orderRepository;
    private readonly transactionRepository;
    private readonly ordersService;
    private readonly logger;
    constructor(orderRepository: Repository<Order>, transactionRepository: Repository<Transaction>, ordersService: OrdersService);
    createRazorpayOrder(userId: string, createPaymentDto: CreatePaymentDto): Promise<{
        orderId: string;
        amount: string | number;
        currency: string;
        key: string | undefined;
    }>;
    verifyPayment(userId: string, verifyPaymentDto: VerifyPaymentDto): Promise<boolean>;
    initiateCodOrder(userId: string, createPaymentDto: CreatePaymentDto): Promise<{
        message: string;
    }>;
    processRazorpayWebhook(event: any): Promise<void>;
    private handlePaymentCaptured;
    private handlePaymentFailed;
    private handleRefundProcessed;
    private updateTransactionStatus;
}
