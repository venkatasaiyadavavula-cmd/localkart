import { User } from './user.entity';
export declare enum AddressType {
    HOME = "home",
    WORK = "work",
    OTHER = "other"
}
export declare class SavedAddress {
    id: string;
    userId: string;
    user: User;
    type: AddressType;
    label: string;
    fullAddress: string;
    landmark: string;
    pincode: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
