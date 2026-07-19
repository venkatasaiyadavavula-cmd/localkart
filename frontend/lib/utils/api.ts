import axios from 'axios';
import { apiClient } from '@/lib/api/client';

/** Unwrap API responses whether backend returns raw data or { success, data }. */
export function unwrapApiData<T = unknown>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

/** Normalize paginated API payloads: { data: T[], meta } or bare array. */
export function normalizeList<T>(payload: unknown): T[] {
  const inner = unwrapApiData(payload);
  if (Array.isArray(inner)) return inner;
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
