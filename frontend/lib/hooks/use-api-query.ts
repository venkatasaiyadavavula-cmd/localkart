import { useQuery, type UseQueryOptions, type QueryKey } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData, fetchApiDataOrNull } from '@/lib/utils';

type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T | null, Error, T | null, QueryKey>,
  'queryKey' | 'queryFn'
>;

type UseApiQueryOptions<T> = ApiQueryOptions<T> & {
  /** When true, HTTP 404 returns null instead of throwing (for detail pages). */
  notFoundAsNull?: boolean;
};

/** Typed GET query against the LocalKart API. */
export function useApiQuery<T>(
  queryKey: QueryKey,
  url: string,
  options?: UseApiQueryOptions<T>,
) {
  const { notFoundAsNull = false, ...queryOptions } = options ?? {};

  return useQuery<T | null>({
    queryKey,
    queryFn: async () => {
      if (notFoundAsNull) {
        return fetchApiDataOrNull<T>(url);
      }
      const { data } = await apiClient.get(url);
      return unwrapApiData<T>(data);
    },
    ...queryOptions,
  });
}
