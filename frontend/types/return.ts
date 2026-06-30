export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  DAMAGED = 'damaged',
  NOT_AS_DESCRIBED = 'not_as_described',
  OTHER = 'other',
}

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  PICKED_UP = 'picked_up',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
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
