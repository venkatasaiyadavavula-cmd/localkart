import { useQuery, type UseQueryOptions, type QueryKey } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, QueryKey>,
  'queryKey' | 'queryFn'
>;

/** Typed GET query against the LocalKart API. */
export function useApiQuery<T>(
  queryKey: QueryKey,
  url: string,
  options?: ApiQueryOptions<T>,
) {
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const { data } = await apiClient.get(url);
      return unwrapApiData<T>(data);
    },
    ...options,
  });
}
