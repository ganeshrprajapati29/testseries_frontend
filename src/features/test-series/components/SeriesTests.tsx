import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { CardSkeleton } from '@/components/common/Skeleton';
import { TestCard } from '@/components/tests/TestCard';
import { useAuth } from '@/features/auth/useAuth';
import { usePagination } from '@/hooks/usePagination';
import { TEST_TYPE_LABELS } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { SeriesDetail } from '@/types';
import { testSeriesApi } from '../testSeries.api';

const PAGE_SIZE = 10;
const TYPE_ORDER = ['FULL_LENGTH', 'SECTIONAL', 'CHAPTER', 'MINI', 'PYQ_PAPER'];

/** Testbook-style test list: type tabs with counts and server-side pagination. */
export function SeriesTests({ series }: { series: SeriesDetail }) {
  const { user } = useAuth();
  const { page, get, setFilter, setPage } = usePagination();
  const type = get('type');
  const query = useQuery({
    queryKey: ['series', 'tests', series.slug, type, page, user?.id],
    queryFn: () => testSeriesApi.tests(series.slug, { page, limit: PAGE_SIZE, type: type || undefined }),
    placeholderData: keepPreviousData,
  });

  const types = TYPE_ORDER.filter((t) => series.typeCounts[t]);
  const tab = (active: boolean) =>
    cn('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition', active ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300');

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Tests in this series <span className="font-normal text-slate-400">({series.totalTests})</span>
        </h2>
      </div>
      {types.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Test type">
          <button type="button" role="tab" aria-selected={!type} onClick={() => setFilter('type', '')} className={tab(!type)}>
            All Tests ({series.totalTests})
          </button>
          {types.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={type === t} onClick={() => setFilter('type', t)} className={tab(type === t)}>
              {TEST_TYPE_LABELS[t] ?? t} ({series.typeCounts[t]})
            </button>
          ))}
        </div>
      )}
      {!series.hasAccess && series.accessType === 'paid' && (
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-accent-50 px-4 py-2.5 text-sm text-accent-800">
          <Lock className="h-4 w-4 shrink-0" /> Purchase this series to unlock all tests. {series.freeTestCount > 0 && `${series.freeTestCount} free test(s) can be attempted right away.`}
        </p>
      )}
      {query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="space-y-3">
          <CardSkeleton count={3} />
        </div>
      ) : !query.data?.items.length ? (
        <EmptyState title="Tests coming soon" message="Tests for this series will be published shortly." />
      ) : (
        <div className={cn('space-y-3', query.isFetching && 'opacity-60 transition')}>
          {query.data.items.map((t) => (
            <TestCard key={t._id} test={t} isLoggedIn={!!user} />
          ))}
          <Pagination meta={query.data.meta} onPageChange={setPage} className="pt-2" />
        </div>
      )}
    </section>
  );
}
