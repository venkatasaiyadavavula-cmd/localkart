export type OrderStatus =
  | 'pending_otp'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export type PaymentMethod = 'cod' | 'razorpay';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: User;
  shopId: string;
  shop: Shop;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  commissionAmount: number;
  commissionRate: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  deliveryOtp?: string;
  deliveryNotes?: string;
  cancellationReason?: string;
  confirmedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  returnRequest?: ReturnRequest;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  commissionRate: number;
  commissionAmount: number;
  createdAt: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  shopId: string;
  reason: ReturnReason;
  description?: string;
  evidenceImages?: string[];
  evidenceVideo?: string;
  status: ReturnStatus;
  refundAmount: number;
  rejectionReason?: string;
  pickupScheduledAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'damaged'
  | 'not_as_described'
  | 'other';

export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'refunded'
  | 'cancelled';

export interface Transaction {
  id: string;
  orderId: string;
  type: 'payment' | 'refund' | 'settlement' | 'commission';
  status: 'pending' | 'success' | 'failed';
  amount: number;
  currency: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Import User and Shop types
import { User } from './user';
import { Shop } from './product';

// Status colors and labels for UI
export const statusColors: Record<OrderStatus, string> = {
  pending_otp: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  ready_for_pickup: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  return_requested: 'bg-pink-100 text-pink-800',
  returned: 'bg-gray-100 text-gray-800',
};

export const statusLabels: Record<OrderStatus, string> = {
  pending_otp: 'Pending OTP',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
};
