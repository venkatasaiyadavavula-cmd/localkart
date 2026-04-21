import { Product } from './product.entity';
export declare class Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    image: string;
    description: string;
    isActive: boolean;
    displayOrder: number;
    commissionRate: number;
    children: Category[];
    parent: Category;
    parentId: string;
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
