import type { Product } from '../../core/entities/product.entity';
import type { UpdateProductDto } from './dto/update-product.dto';

/**
 * Product fields that require admin re-approval when changed on a live listing.
 * Videos, stock-only tweaks, etc. are intentionally excluded.
 */
export const PRODUCT_FIELDS_REQUIRING_REAPPROVAL = [
  'name',
  'description',
  'price',
  'mrp',
  'categoryType',
  'categoryId',
  'images',
] as const;

export type ProductReapprovalField = (typeof PRODUCT_FIELDS_REQUIRING_REAPPROVAL)[number];

function stringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function decimalEqual(a: unknown, b: unknown): boolean {
  const left = a === null || a === undefined ? null : Number(a);
  const right = b === null || b === undefined ? null : Number(b);
  if (left === null && right === null) return true;
  if (left === null || right === null) return false;
  return left === right;
}

type ProductSnapshot = Pick<Product, ProductReapprovalField>;

export function productUpdateRequiresReapproval(
  dto: UpdateProductDto,
  existing: ProductSnapshot,
): boolean {
  for (const field of PRODUCT_FIELDS_REQUIRING_REAPPROVAL) {
    if (!Object.prototype.hasOwnProperty.call(dto, field)) {
      continue;
    }

    const incoming = dto[field];
    if (incoming === undefined) {
      continue;
    }

    if (field === 'images') {
      const nextImages = Array.isArray(incoming) ? (incoming as string[]) : [];
      const prevImages = existing.images ?? [];
      if (!stringArraysEqual(nextImages, prevImages)) {
        return true;
      }
      continue;
    }

    if (field === 'price' || field === 'mrp') {
      if (!decimalEqual(incoming, existing[field])) {
        return true;
      }
      continue;
    }

    if (incoming !== existing[field]) {
      return true;
    }
  }

  return false;
}
