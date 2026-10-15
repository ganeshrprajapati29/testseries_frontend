import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES, seriesUrl } from '@/app/constants';
import { PageHeader } from '@/components/common/Badge';
import { Badge } from '@/components/common/Badge';
import { ButtonLink, buttonClasses } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { CardSkeleton } from '@/components/common/Skeleton';
import { formatDate } from '@/lib/formatters';
import { studentApi } from '../student.api';

export default function MyTestsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'my-tests'], queryFn: studentApi.myTests });

  return (
    <div>
      <PageHeader title="My Tests" description="Test series you have added or purchased." />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton count={4} />
        </div>
      ) : !data?.length ? (
        <EmptyState icon={BookOpenCheck} title="You have not added any test series" message="Explore free and premium test series for your exam." action={<ButtonLink to={ROUTES.testSeries}>Explore test series</ButtonLink>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((e) => {
            const pct = e.totalTests ? Math.round((e.completedTests / e.totalTests) * 100) : 0;
            return (
              <div key={e._id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">{e.series.categoryId?.name ?? e.series.examName}</p>
                    <h2 className="mt-1 font-semibold">{e.series.title}</h2>
                  </div>
                  <Badge tone={e.source === 'purchase' ? 'orange' : e.source === 'admin' ? 'purple' : 'green'}>{e.source === 'purchase' ? 'Purchased' : e.source === 'admin' ? 'Granted' : 'Free'}</Badge>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      {e.completedTests} of {e.totalTests} tests completed
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{e.expiresAt ? `Valid till ${formatDate(e.expiresAt)}` : 'Lifetime access'}</span>
                  <Link to={seriesUrl(e.series.slug)} className={buttonClasses('primary', 'sm')}>
                    Open series
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
