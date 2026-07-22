import type { Product, Shop } from './product';
import type { Order, ShippingAddress } from './order';
import type { Subscription } from './subscription';
import type { AdCampaign } from './ad-campaign';

export interface DailyOffer {
  id: string;
  offerPrice: number;
  originalPrice: number;
  discountPercentage: number;
  expiresAt: string;
  isActive?: boolean;
  sellerNotes?: string;
  offerDetails?: Record<string, string>;
  product?: { id: string; name: string; price?: number };
}

export interface ProductWithOffer extends Product {
  daily_offer?: DailyOffer;
  daily_offers?: DailyOffer[];
}

export interface SellerDashboardStats {
  shopName?: string;
  totalRevenue: number;
  totalOrders: number;
  productsSold: number;
  activeProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  revenueChange?: number;
  ordersChange?: number;
  productsSoldChange?: number;
  activeProductsChange?: number;
  isCurrentlyOpen?: boolean;
  statusMessage?: string;
  salesChart?: { date: string; sales: number; orders: number }[];
  recentOrders?: Order[];
  topProducts?: Product[];
}

export interface AdminCommissionsSummary {
  currentRates: Record<string, number>;
  shopEarnings: {
    id: string;
    name: string;
    totalEarnings: number;
    pendingSettlement: number;
    lastSettlement: string | null;
  }[];
  totalCommission: number;
  totalRevenue: number;
  pendingSettlements: number;
}

/** @deprecated Legacy settlement summary — admin UI now uses AdminCommissionSummary */
export interface AdminCommissionBill {
  id: string;
  shopId: string;
  shop: { id: string; name: string } | null;
  billDate: string;
  weekStartDate?: string | null;
  weekLabel: string;
  orderCount: number;
  totalOrderValue: number;
  commissionAmount: number;
  fineAmount: number;
  totalDue: number;
  daysOverdue: number;
  status: 'pending' | 'paid' | 'overdue';
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  adminPaymentRef?: string | null;
  adminNote?: string | null;
  paidAt?: string | null;
}

export interface AdminCommissionSummary {
  totalOutstanding: number;
  overdueBillCount: number;
  overdueShopCount: number;
  collectedThisWeek: number;
  collectedThisMonth: number;
  billsGeneratedThisWeek: number;
  currentWeekEndingFriday: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  helpfulCount?: number;
  createdAt: string;
  user?: { name?: string };
}

export interface ProductReviewsData {
  reviews: Review[];
  total: number;
  ratingBreakdown: { rating: number; count: number }[];
}

export interface CanReviewResponse {
  canReview: boolean;
  orderId?: string;
  alreadyReviewed?: boolean;
}

export interface FeaturedVideo {
  id: string;
  videoUrl: string;
  expiresAt: string;
  status?: string;
  amount?: number;
  product: {
    id: string;
    name: string;
    price: number;
    slug?: string;
    categoryType?: string;
  };
}

export interface VideoPreviewItem {
  id: string;
  videoUrl: string;
  name: string;
  price: number;
  slug?: string;
  categoryType?: string;
  expiresAt?: string;
  isFeatured: boolean;
}

export interface SubscriptionData extends Subscription {
  productCount?: number;
}

export interface WeeklyEarningsData {
  weeks: { weekLabel: string; orderCount: number; gross: number; commission: number; net: number }[];
  growth: number;
  currentWeek: { weekLabel: string; orderCount: number; gross: number; commission: number; net: number };
}

export interface CommissionBillsData {
  bills: {
    id: string;
    billDate: string;
    weekStartDate?: string | null;
    weekLabel?: string;
    orderCount: number;
    totalOrderValue: number;
    commissionAmount: number;
    fineAmount: number;
    daysOverdue: number;
    status: 'pending' | 'paid' | 'overdue';
    paidAt?: string;
  }[];
  totalPending: number;
}

export interface WishlistItem {
  id: string;
  product: import('./product').Product;
}

export interface TrackedOrder extends Order {
  deliveryAddress?: ShippingAddress & { latitude?: number; longitude?: number };
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  locationUpdatedAt?: string;
  deliveryStaffName?: string;
  deliveryStaffPhone?: string;
}

export interface AdCampaignsData {
  sponsored: AdCampaign[];
  video: AdCampaign[];
  all: AdCampaign[];
}

export interface ProductsListResponse {
  products?: Product[];
  data?: Product[];
  total?: number;
}

export type ShopData = Shop;
