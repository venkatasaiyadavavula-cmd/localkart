import axios from 'axios';
import { apiClient } from '@/lib/api/client';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Unwrap API responses whether backend returns raw data or { success, data }. */
export function unwrapApiData<T = unknown>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function isPaginatedPayload<T>(
  value: unknown,
): value is { data: T[]; meta: PaginationMeta } {
  return (
    !!value &&
    typeof value === 'object' &&
    'data' in value &&
    'meta' in value &&
    Array.isArray((value as { data: unknown }).data)
  );
}

export function normalizePaginationMeta(meta: unknown): PaginationMeta {
  if (!meta || typeof meta !== 'object') {
    return { total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  const raw = meta as Record<string, unknown>;
  const total = Number(raw.total) || 0;
  const page = Number(raw.page) || 1;
  const limit = Number(raw.limit) || 20;
  const totalPages =
    Number(raw.totalPages) || (limit > 0 ? Math.ceil(total / limit) : 0);

  return { total, page, limit, totalPages };
}

/**
 * Normalize paginated API payloads.
 * Handles both `{ data, meta }` (direct Nest response) and
 * `{ success, data: { data, meta } }` (transform-wrapped response).
 */
export function unwrapPaginated<T>(payload: unknown): {
  data: T[];
  meta: PaginationMeta;
} {
  if (isPaginatedPayload<T>(payload)) {
    return {
      data: payload.data,
      meta: normalizePaginationMeta(payload.meta),
    };
  }

  const inner = unwrapApiData(payload);
  if (isPaginatedPayload<T>(inner)) {
    return {
      data: inner.data,
      meta: normalizePaginationMeta(inner.meta),
    };
  }

  if (Array.isArray(inner)) {
    return {
      data: inner,
      meta: {
        total: inner.length,
        page: 1,
        limit: inner.length || 20,
        totalPages: 1,
      },
    };
  }

  return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
}

export function normalizeList<T>(payload: unknown): T[] {
  if (isPaginatedPayload<T>(payload)) {
    return payload.data;
  }

  const inner = unwrapApiData(payload);
  if (Array.isArray(inner)) return inner;
  if (isPaginatedPayload<T>(inner)) {
    return inner.data;
  }
  if (inner && typeof inner === 'object') {
    const obj = inner as { data?: T[] };
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

/** GET helper that returns null on 404 instead of throwing. */
export async function fetchApiDataOrNull<T>(
  url: string,
  notFoundStatus = 404,
): Promise<T | null> {
  try {
    const { data } = await apiClient.get(url);
    return unwrapApiData<T>(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === notFoundStatus) {
      return null;
    }
    throw error;
  }
}

/** Format delivery address whether stored as string or object. */
export function formatDeliveryAddress(address: unknown): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const a = address as Record<string, string | undefined>;
    return [a.address || a.fullAddress, a.city, a.pincode, a.landmark]
      .filter(Boolean)
      .join(', ');
  }
  return String(address);
}
