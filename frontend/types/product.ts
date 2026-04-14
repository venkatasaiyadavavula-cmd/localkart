export type ProductCategoryType =
  | 'groceries'
  | 'fashion'
  | 'electronics'
  | 'home_essentials'
  | 'beauty'
  | 'accessories';

export type ProductStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  mrp?: number;
  discountPercentage?: number;
  stock: number;
  sku?: string;
  brand?: string;
  categoryType: ProductCategoryType;
  categoryId?: string;
  category?: Category;
  images?: string[];
  videos?: string[];
  attributes?: Record<string, any>;
  status: ProductStatus;
  rejectionReason?: string;
  isSponsored: boolean;
  sponsoredUntil?: string;
  viewCount: number;
  orderCount: number;
  rating: number;
  reviewCount: number;
  shopId: string;
  shop: Shop;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  commissionRate: number;
  parentId?: string;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  bannerImage?: string;
  logoImage?: string;
  contactPhone: string;
  contactEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  totalProducts: number;
  totalOrders: number;
  rating: number;
  reviewCount: number;
  openingTime?: string;
  closingTime?: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  distance?: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  categoryType?: ProductCategoryType;
  categoryId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'createdAt' | 'rating' | 'orderCount';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  query?: string;
}
