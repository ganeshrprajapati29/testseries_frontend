import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/apiClient';
import { QUERY_KEYS } from './constants';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // An expired session anywhere should immediately refresh the auth state.
      if (error instanceof ApiError && error.status === 401) {
        queryClient.setQueryData(QUERY_KEYS.me, { user: null });
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return count < 2;
      },
    },
    mutations: { retry: false },
  },
});
