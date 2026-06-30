export declare class SendOtpDto {
    phone: string;
    mode?: string;
    orderId?: string;
}
export declare class VerifyOtpDto {
    phone: string;
    otp: string;
    mode?: string;
    orderId?: string;
}
