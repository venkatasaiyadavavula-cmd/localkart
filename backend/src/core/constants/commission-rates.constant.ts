import { ProductCategoryType } from '../entities/product.entity';

/** Default commission % by product category — used when DB row is missing or rate is 0. */
export const DEFAULT_COMMISSION_RATES: Record<ProductCategoryType, number> = {
  [ProductCategoryType.GROCERIES]: 2,
  [ProductCategoryType.FASHION]: 4,
  [ProductCategoryType.ELECTRONICS]: 3,
  [ProductCategoryType.HOME_ESSENTIALS]: 4,
  [ProductCategoryType.BEAUTY]: 5,
  [ProductCategoryType.ACCESSORIES]: 5,
};

/** Product.categoryType → categories.slug (slug uses hyphens). */
export const CATEGORY_TYPE_TO_SLUG: Record<ProductCategoryType, string> = {
  [ProductCategoryType.GROCERIES]: 'groceries',
  [ProductCategoryType.FASHION]: 'fashion',
  [ProductCategoryType.ELECTRONICS]: 'electronics',
  [ProductCategoryType.HOME_ESSENTIALS]: 'home-essentials',
  [ProductCategoryType.BEAUTY]: 'beauty',
  [ProductCategoryType.ACCESSORIES]: 'accessories',
};

export const CATEGORY_TYPE_LABELS: Record<ProductCategoryType, string> = {
  [ProductCategoryType.GROCERIES]: 'Groceries',
  [ProductCategoryType.FASHION]: 'Fashion',
  [ProductCategoryType.ELECTRONICS]: 'Electronics',
  [ProductCategoryType.HOME_ESSENTIALS]: 'Home Essentials',
  [ProductCategoryType.BEAUTY]: 'Beauty',
  [ProductCategoryType.ACCESSORIES]: 'Accessories',
};

export const FALLBACK_COMMISSION_RATE = 3;
