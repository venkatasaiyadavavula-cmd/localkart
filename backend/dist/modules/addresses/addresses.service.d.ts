import { Repository } from 'typeorm';
import { SavedAddress, AddressType } from '../../core/entities/saved-address.entity';
export declare class AddressesService {
    private readonly addressRepo;
    constructor(addressRepo: Repository<SavedAddress>);
    getAddresses(userId: string): Promise<SavedAddress[]>;
    addAddress(userId: string, dto: {
        type: AddressType;
        label: string;
        fullAddress: string;
        landmark?: string;
        pincode?: string;
        latitude?: number;
        longitude?: number;
        isDefault?: boolean;
    }): Promise<SavedAddress>;
    updateAddress(userId: string, id: string, dto: Partial<{
        type: AddressType;
        label: string;
        fullAddress: string;
        landmark: string;
        pincode: string;
        isDefault: boolean;
    }>): Promise<SavedAddress>;
    deleteAddress(userId: string, id: string): Promise<{
        message: string;
    }>;
    setDefault(userId: string, id: string): Promise<{
        message: string;
    }>;
}
