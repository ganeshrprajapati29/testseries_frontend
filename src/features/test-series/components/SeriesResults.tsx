import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { CardSkeleton } from '@/components/common/Skeleton';
import { TestFilters } from '@/components/tests/TestFilters';
import { TestSeriesCard } from '@/components/tests/TestSeriesCard';
import { useAuth } from '@/features/auth/useAuth';
import { usePagination } from '@/hooks/usePagination';
import { testSeriesApi } from '../testSeries.api';

/** Filterable, paginated grid of published series; filters live in the URL. */
export function SeriesResults({ categoryId }: { categoryId?: string }) {
  const { user } = useAuth();
  const { page, get, setFilter, setPage } = usePagination();
  const filters = { search: get('search'), accessType: get('accessType'), sort: get('sort') || 'popular' };

  const query = useQuery({
    queryKey: ['series', 'list', { page, categoryId, ...filters, user: user?.id }],
    queryFn: () =>
      testSeriesApi.list({
        page,
        limit: 12,
        category: categoryId,
        search: filters.search || undefined,
        accessType: (filters.accessType as 'free' | 'paid') || undefined,
        sort: filters.sort as 'popular',
      }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-5">
      <TestFilters values={filters} onChange={(k, v) => setFilter(k, v)} />
      {query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton count={6} />
        </div>
      ) : !query.data?.items.length ? (
        <EmptyState
          icon={SearchX}
          title="No test series found"
          message={filters.search || filters.accessType ? 'Try changing your search or filters.' : 'Test series for this exam will be published soon.'}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {query.data.items.map((s) => (
              <TestSeriesCard key={s._id} series={s} />
            ))}
          </div>
          <Pagination meta={query.data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
