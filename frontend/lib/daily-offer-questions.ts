export type OfferQuestionType = 'text' | 'number' | 'textarea' | 'select';

export interface OfferQuestion {
  key: string;
  label: string;
  labelTe: string;
  type: OfferQuestionType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

const BASE_QUESTIONS: OfferQuestion[] = [
  {
    key: 'offerStock',
    label: 'Units available for this deal',
    labelTe: 'ఈ ఆఫర్‌కు అందుబాటులో ఉన్న యూనిట్లు',
    type: 'number',
    required: true,
    placeholder: 'e.g. 10',
  },
];

const CATEGORY_QUESTIONS: Record<string, OfferQuestion[]> = {
  fashion: [
    {
      key: 'size',
      label: 'Available size(s)',
      labelTe: 'అందుబాటులో ఉన్న సైజ్(లు)',
      type: 'text',
      required: true,
      placeholder: 'S, M, L, XL',
    },
    {
      key: 'color',
      label: 'Color',
      labelTe: 'రంగు',
      type: 'text',
      required: true,
      placeholder: 'Red, Blue, etc.',
    },
  ],
  electronics: [
    {
      key: 'model',
      label: 'Model / Variant',
      labelTe: 'మోడల్ / వేరియంట్',
      type: 'text',
      placeholder: 'e.g. 128GB Black',
    },
    {
      key: 'warranty',
      label: 'Warranty included?',
      labelTe: 'వారంటీ ఉందా?',
      type: 'select',
      options: ['Yes', 'No'],
    },
  ],
  groceries: [
    {
      key: 'weight',
      label: 'Weight / Pack size',
      labelTe: 'బరువు / ప్యాక్ సైజ్',
      type: 'text',
      required: true,
      placeholder: '1 kg, 500g',
    },
    {
      key: 'freshness',
      label: 'Freshness note',
      labelTe: 'తాజాదన గురించి',
      type: 'text',
      placeholder: 'Harvested today',
    },
  ],
  beauty: [
    {
      key: 'shade',
      label: 'Shade / Variant',
      labelTe: 'షేడ్ / వేరియంట్',
      type: 'text',
      placeholder: 'Rose Pink',
    },
    {
      key: 'expiry',
      label: 'Expiry date (if applicable)',
      labelTe: 'గడువు తేదీ',
      type: 'text',
      placeholder: 'Dec 2026',
    },
  ],
  home_essentials: [
    {
      key: 'dimensions',
      label: 'Size / Dimensions',
      labelTe: 'పరిమాణం',
      type: 'text',
      placeholder: '10x12 inches',
    },
  ],
  accessories: [
    {
      key: 'color',
      label: 'Color',
      labelTe: 'రంగు',
      type: 'text',
    },
    {
      key: 'material',
      label: 'Material',
      labelTe: 'మెటీరియల్',
      type: 'text',
      placeholder: 'Leather, Metal',
    },
  ],
};

export function getOfferQuestionsForProduct(product: {
  categoryType?: string;
  attributes?: Record<string, unknown>;
  stock?: number;
}): OfferQuestion[] {
  const category = product.categoryType || 'default';
  const categorySpecific = CATEGORY_QUESTIONS[category] || [];

  const fromAttributes: OfferQuestion[] = [];
  if (product.attributes && typeof product.attributes === 'object') {
    Object.entries(product.attributes).forEach(([key, value]) => {
      if (value == null || value === '') return;
      const already = [...categorySpecific, ...BASE_QUESTIONS].some((q) => q.key === key);
      if (!already) {
        fromAttributes.push({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          labelTe: key,
          type: 'text',
          placeholder: String(value),
        });
      }
    });
  }

  return [...categorySpecific, ...fromAttributes, ...BASE_QUESTIONS];
}

import type { DailyOffer } from '@/types/api';

export function getOfferOnProduct(product: {
  daily_offer?: DailyOffer;
  daily_offers?: DailyOffer[];
}): DailyOffer | null {
  if (product.daily_offer) return product.daily_offer;
  if (Array.isArray(product.daily_offers) && product.daily_offers[0]) {
    return product.daily_offers[0];
  }
  return null;
}
