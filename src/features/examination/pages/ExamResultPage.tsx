import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck, Clock3, LayoutDashboard, RotateCcw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { instructionsUrl, ROUTES, solutionsUrl, testUrl } from '@/app/constants';
import { ButtonLink } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ResultSummary } from '@/components/tests/ResultSummary';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { testSeriesApi } from '@/features/test-series/testSeries.api';
import { formatDateTime } from '@/lib/formatters';
import { examinationApi } from '../examination.api';

export default function ExamResultPage() {
  const { attemptId = '' } = useParams();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'result', attemptId], queryFn: () => examinationApi.result(attemptId) });
  const test = useQuery({
    queryKey: ['test', data?.testSlug, 'for-result'],
    queryFn: () => testSeriesApi.test(data!.testSlug!),
    enabled: !!data?.testSlug,
  });

  if (isLoading) return <Loader fullScreen label="Preparing your result..." />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Result not available" />
      </div>
    );

  const canReattempt = test.data && test.data.hasAccess && test.data.availability === 'OPEN' && test.data.attemptsLeft !== 0 && !test.data.inProgressAttemptId;

  return (
    <div className="container-page max-w-6xl py-8">
      <Breadcrumbs items={[{ label: 'My Results', to: ROUTES.myResults }, { label: data.testTitle }]} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{data.testTitle}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            Attempt {data.attemptNumber} • Submitted {formatDateTime(data.submittedAt)} <StatusBadge status={data.status} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.resultVisible && (
            <ButtonLink to={solutionsUrl(attemptId)} icon={<BookOpenCheck className="h-4 w-4" />}>
              View solutions
            </ButtonLink>
          )}
          {canReattempt && (
            <ButtonLink to={instructionsUrl(test.data!.slug)} variant="outline" icon={<RotateCcw className="h-4 w-4" />}>
              Reattempt
            </ButtonLink>
          )}
        </div>
      </div>

      {data.resultVisible && data.totalScore !== undefined ? (
        <ResultSummary result={data as Parameters<typeof ResultSummary>[0]['result']} />
      ) : (
        <div className="card flex flex-col items-center p-10 text-center">
          <Clock3 className="h-12 w-12 text-brand-500" />
          <h2 className="mt-4 text-xl font-bold">Your test has been submitted</h2>
          <p className="mt-2 max-w-md text-slate-600">{data.message || 'Your result will be available soon.'}</p>
          {data.releaseAt && <p className="mt-1 text-sm text-slate-500">Expected on {formatDateTime(data.releaseAt)}</p>}
          <div className="mt-6 flex gap-2">
            <ButtonLink to={ROUTES.dashboard} icon={<LayoutDashboard className="h-4 w-4" />}>
              Go to dashboard
            </ButtonLink>
            {data.testSlug && (
              <ButtonLink to={testUrl(data.testSlug)} variant="outline">
                Back to test
              </ButtonLink>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
