import { LocationService } from './location.service';
import { NearbyShopsDto } from './dto/nearby-shops.dto';
export declare class LocationController {
    private readonly locationService;
    constructor(locationService: LocationService);
    getNearbyShops(query: NearbyShopsDto): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    searchShops(lat: number, lng: number, radius: number, query: string): Promise<any[]>;
    getAvailableCities(): Promise<any[]>;
    getPincodesByCity(city: string): Promise<any[]>;
    checkServiceability(lat: number, lng: number, radius?: string): Promise<{
        serviceable: boolean;
        shopsCount: number;
        maxDistance?: number;
    }>;
}
