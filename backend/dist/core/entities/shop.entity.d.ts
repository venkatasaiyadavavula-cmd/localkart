import { User } from './user.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';
import { Subscription } from './subscription.entity';
export declare enum ShopStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    SUSPENDED = "suspended"
}
export declare enum ManualOverride {
    NONE = "none",
    FORCE_OPEN = "force_open",
    FORCE_CLOSED = "force_closed"
}
export declare class Shop {
    id: string;
    name: string;
    slug: string;
    description: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    location: string;
    latitude: number;
    longitude: number;
    bannerImage: string;
    logoImage: string;
    contactPhone: string;
    phone: string;
    contactEmail: string;
    status: ShopStatus;
    totalProducts: number;
    totalOrders: number;
    totalEarnings: number;
    rating: number;
    reviewCount: number;
    openingTime: string;
    closingTime: string;
    operatingHours: Record<string, {
        open: string;
        close: string;
        isOpen: boolean;
    }>;
    manualOverride: ManualOverride;
    manualOverrideSetAt: Date | null;
    deliveryPincodes: string[];
    deliveryCharge: number;
    freeDeliveryAbove: number;
    fssaiLicense: string;
    gstNumber: string;
    panCard: string;
    owner: User;
    ownerId: string;
    products: Product[];
    orders: Order[];
    subscriptions: Subscription[];
    createdAt: Date;
    updatedAt: Date;
}
