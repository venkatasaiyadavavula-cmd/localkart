export declare class SmsService {
    private readonly logger;
    private readonly twilioClient;
    constructor();
    sendSms(to: string, message: string): Promise<boolean>;
    private formatPhoneNumber;
}
