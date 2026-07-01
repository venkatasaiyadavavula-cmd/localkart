/** Unwrap API responses whether backend returns raw data or { success, data }. */
export function unwrapApiData<T = unknown>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
