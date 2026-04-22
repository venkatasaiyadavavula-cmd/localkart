import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
export declare class WebhookController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    handleRazorpayWebhook(signature: string, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
