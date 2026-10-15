import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useToast } from '@/components/common/Toast';
import { errorMessage } from '@/services/apiClient';

/** Mutation with success/error toasts and cache invalidation of admin queries. */
export function useAdminMutation<TVars, TData = unknown>(
  fn: (vars: TVars) => Promise<TData>,
  opts: { success?: string | ((data: TData) => string); invalidate?: QueryKey[]; onSuccess?: (data: TData, vars: TVars) => void; silentError?: boolean } = {},
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      const msg = typeof opts.success === 'function' ? opts.success(data) : opts.success;
      if (msg) toast.success(msg);
      for (const key of opts.invalidate ?? [['admin']]) qc.invalidateQueries({ queryKey: key });
      opts.onSuccess?.(data, vars);
    },
    onError: (err) => {
      if (!opts.silentError) toast.error(errorMessage(err));
    },
  });
}
