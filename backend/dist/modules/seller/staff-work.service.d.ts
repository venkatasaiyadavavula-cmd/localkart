import { Repository } from 'typeorm';
import { Shop } from '../../core/entities/shop.entity';
import { CatalogService } from '../catalog/catalog.service';
import { OrdersService } from '../orders/orders.service';
import { CreateProductDto } from '../catalog/dto/create-product.dto';
import { UpdateProductDto } from '../catalog/dto/update-product.dto';
import { SearchQueryDto } from '../catalog/dto/search-query.dto';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { UpdateDeliveryLocationDto } from '../orders/dto/update-delivery-location.dto';
export declare class StaffWorkService {
    private readonly shopRepo;
    private readonly catalogService;
    private readonly ordersService;
    constructor(shopRepo: Repository<Shop>, catalogService: CatalogService, ordersService: OrdersService);
    private resolveOwnerId;
    getProfile(staffUser: any): Promise<{
        id: any;
        name: any;
        staffId: any;
        staffRole: any;
        shopId: any;
        shopName: any;
        permissions: any;
    }>;
    getProducts(staffUser: any, query: SearchQueryDto): Promise<{
        data: import("../../core/entities/product.entity").Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createProduct(staffUser: any, dto: CreateProductDto): Promise<import("../../core/entities/product.entity").Product>;
    updateProduct(staffUser: any, productId: string, dto: UpdateProductDto): Promise<import("../../core/entities/product.entity").Product>;
    getOrders(staffUser: any, page?: number, limit?: number, status?: string): Promise<{
        data: import("../../core/entities/order.entity").Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateOrderStatus(staffUser: any, orderId: string, dto: UpdateOrderStatusDto): Promise<import("../../core/entities/order.entity").Order>;
    updateDeliveryLocation(staffUser: any, orderId: string, dto: UpdateDeliveryLocationDto): Promise<{
        latitude: number;
        longitude: number;
        updatedAt: string;
        staffName: string;
        message: string;
    }>;
}
