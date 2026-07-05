export type AdPackage = 'day' | 'week' | 'month';

export const AD_PACKAGES: Record<AdPackage, { days: number; price: number; label: string }> = {
  day:   { days: 1,  price: 50,   label: '1 Day' },
  week:  { days: 7,  price: 200,  label: '1 Week' },
  month: { days: 30, price: 1000, label: '1 Month' },
};

export const FEATURED_VIDEO_PRICE = 29;
export const FEATURED_VIDEO_HOURS = 24;
