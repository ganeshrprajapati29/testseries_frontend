import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps page number and filters in the URL so lists survive refresh and back navigation.
 */
export function usePagination(defaults: Record<string, string> = {}) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);

  const get = useCallback((key: string) => params.get(key) ?? defaults[key] ?? '', [params, defaults]);

  const setFilter = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setPage = useCallback(
    (p: number) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p > 1) next.set('page', String(p));
        else next.delete('page');
        return next;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setParams],
  );

  return { page, get, setFilter, setPage, params };
}
