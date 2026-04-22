export declare class ShopProfileDto {
    name: string;
    description?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    contactPhone: string;
    contactEmail?: string;
    openingTime?: string;
    closingTime?: string;
    deliveryPincodes?: string[];
    deliveryCharge?: number;
    freeDeliveryAbove?: number;
    fssaiLicense?: string;
    gstNumber?: string;
    panCard?: string;
}
