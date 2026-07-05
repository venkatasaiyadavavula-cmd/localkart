import { Shop } from '../entities/shop.entity';
import { OperatingHours, ShopHoursStatus } from '../types/shop-hours.types';
export declare function createDefaultOperatingHours(): OperatingHours;
export declare function isShopCurrentlyOpen(shop: Shop): boolean;
export declare function getShopHoursStatus(shop: Shop): ShopHoursStatus;
export declare function enrichShopWithHoursStatus<T extends Shop>(shop: T): T & ShopHoursStatus;
export declare function enrichProductWithShopHours<T extends {
    shop?: Shop | null;
}>(product: T): T;
export declare function enrichProductsWithShopHours<T extends {
    shop?: Shop | null;
}>(products: T[]): T[];
export declare function migrateLegacyHoursToOperatingHours(shop: Shop): OperatingHours;
