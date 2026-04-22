import { PaymentMethod } from '../../../core/entities/order.entity';
declare class ShippingAddressDto {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
}
export declare class CreateOrderDto {
    paymentMethod?: PaymentMethod;
    shippingAddress: ShippingAddressDto;
    deliveryNotes?: string;
}
export {};
