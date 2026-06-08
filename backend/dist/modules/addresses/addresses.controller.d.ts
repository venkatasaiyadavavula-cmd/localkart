import { AddressesService } from './addresses.service';
import { AddressType } from '../../core/entities/saved-address.entity';
export declare class AddressesController {
    private readonly addressesService;
    constructor(addressesService: AddressesService);
    getAddresses(user: any): Promise<import("../../core/entities/saved-address.entity").SavedAddress[]>;
    addAddress(user: any, dto: {
        type: AddressType;
        label: string;
        fullAddress: string;
        landmark?: string;
        pincode?: string;
        latitude?: number;
        longitude?: number;
        isDefault?: boolean;
    }): Promise<import("../../core/entities/saved-address.entity").SavedAddress>;
    updateAddress(user: any, id: string, dto: any): Promise<import("../../core/entities/saved-address.entity").SavedAddress>;
    deleteAddress(user: any, id: string): Promise<{
        message: string;
    }>;
    setDefault(user: any, id: string): Promise<{
        message: string;
    }>;
}
