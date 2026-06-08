export declare class SmsService {
    private readonly logger;
    private readonly fast2smsApiKey;
    constructor();
    sendSms(to: string, message: string): Promise<boolean>;
    private formatPhoneNumber;
}
