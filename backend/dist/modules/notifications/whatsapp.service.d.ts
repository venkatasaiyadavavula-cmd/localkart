export declare class WhatsappService {
    private readonly logger;
    private readonly token;
    private readonly phoneId;
    private get enabled();
    private send;
    sendOrderPlacedWithScamWarning(customerPhone: string, customerName: string, orderNumber: string, shopName: string, totalAmount: number, paymentMethod: 'cod' | 'razorpay'): Promise<boolean>;
    sendOrderStatusUpdate(customerPhone: string, customerName: string, orderNumber: string, status: string): Promise<boolean>;
    sendNewOrderToSeller(sellerPhone: string, shopName: string, orderNumber: string, itemsSummary: string, totalAmount: number): Promise<boolean>;
    sendCommissionReminder(sellerPhone: string, shopName: string, billDate: string, commissionAmount: number, fineAmount: number, daysOverdue: number): Promise<boolean>;
    sendWeeklyEarningsSummary(sellerPhone: string, shopName: string, weekLabel: string, orderCount: number, grossEarnings: number, commission: number, netEarnings: number): Promise<boolean>;
}
