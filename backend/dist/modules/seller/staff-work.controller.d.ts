import { StaffWorkService } from './staff-work.service';
import { CreateProductDto } from '../catalog/dto/create-product.dto';
import { UpdateProductDto } from '../catalog/dto/update-product.dto';
import { SearchQueryDto } from '../catalog/dto/search-query.dto';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { UpdateDeliveryLocationDto } from '../orders/dto/update-delivery-location.dto';
export declare class StaffWorkController {
    private readonly staffWorkService;
    constructor(staffWorkService: StaffWorkService);
    getProfile(user: any): Promise<{
        id: any;
        name: any;
        staffId: any;
        staffRole: any;
        shopId: any;
        shopName: any;
        permissions: any;
    }>;
    getProducts(user: any, query: SearchQueryDto): Promise<{
        data: import("../../core/entities/product.entity").Product[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createProduct(user: any, dto: CreateProductDto): Promise<import("../../core/entities/product.entity").Product>;
    updateProduct(user: any, id: string, dto: UpdateProductDto): Promise<import("../../core/entities/product.entity").Product>;
    getOrders(user: any, page?: string, limit?: string, status?: string): Promise<{
        data: import("../../core/entities/order.entity").Order[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateOrderStatus(user: any, id: string, dto: UpdateOrderStatusDto): Promise<import("../../core/entities/order.entity").Order>;
    updateDeliveryLocation(user: any, id: string, dto: UpdateDeliveryLocationDto): Promise<{
        latitude: number;
        longitude: number;
        updatedAt: string;
        staffName: string;
        message: string;
    }>;
}
