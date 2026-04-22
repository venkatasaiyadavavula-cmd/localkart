import { Repository } from 'typeorm';
import { Shop } from '../../core/entities/shop.entity';
import { NearbyShopsDto } from './dto/nearby-shops.dto';
export declare class LocationService {
    private readonly shopRepository;
    constructor(shopRepository: Repository<Shop>);
    findNearbyShops(query: NearbyShopsDto): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    searchShopsByName(latitude: number, longitude: number, radius: number, query: string): Promise<any[]>;
    getAvailableCities(): Promise<any[]>;
    getPincodesByCity(city: string): Promise<any[]>;
    updateShopLocation(shopId: string, latitude: number, longitude: number): Promise<void>;
    checkServiceability(lat: number, lng: number, radius?: number): Promise<{
        serviceable: boolean;
        shopsCount: number;
        maxDistance?: number;
    }>;
}
