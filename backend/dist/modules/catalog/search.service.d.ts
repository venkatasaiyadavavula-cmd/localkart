import { Repository } from 'typeorm';
import { Product } from '../../core/entities/product.entity';
export declare class SearchService {
    private readonly productRepository;
    constructor(productRepository: Repository<Product>);
    searchProducts(query: string, userLat?: number, userLng?: number): Promise<any[]>;
    getSponsoredProducts(userLat?: number, userLng?: number): Promise<Product[]>;
}
