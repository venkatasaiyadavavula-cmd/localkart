export type AdType = 'sponsored' | 'video';

export type AdStatus = 'pending' | 'active' | 'paused' | 'expired' | 'cancelled';

export interface AdCampaign {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    images?: string[];
  };
  shopId: string;
  adType: AdType;
  status: AdStatus;
  costPerDay: number;
  startDate: string;
  endDate: string;
  totalCost: number;
  impressions: number;
  clicks: number;
  razorpayPaymentId?: string;
  targeting?: {
    pincodes?: string[];
    categories?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdCampaignDto {
  productId: string;
  adType: AdType;
  startDate: string;
  endDate: string;
  targeting?: {
    pincodes?: string[];
    categories?: string[];
  };
}
