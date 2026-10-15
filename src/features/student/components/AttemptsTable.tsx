import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { examUrl, resultUrl, ROUTES, solutionsUrl } from '@/app/constants';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ButtonLink } from '@/components/common/Button';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime, formatDuration, formatScore } from '@/lib/formatters';
import type { AttemptHistoryItem } from '@/types';
import { studentApi } from '../student.api';

export function AttemptsTable({ status }: { status?: 'COMPLETED' | 'IN_PROGRESS' }) {
  const { page, setPage } = usePagination();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'attempts', status, page],
    queryFn: () => studentApi.attempts({ page, limit: 15, status }),
    placeholderData: (p) => p,
  });

  return (
    <DataTable<AttemptHistoryItem>
      rows={data?.items}
      meta={data?.meta}
      onPageChange={setPage}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      rowKey={(r) => r.id}
      emptyTitle="No attempts yet"
      emptyMessage="Your attempted tests will appear here."
      emptyAction={<ButtonLink to={ROUTES.testSeries} size="sm">Find a test</ButtonLink>}
      columns={[
        {
          key: 'test',
          header: 'Test',
          render: (r) => (
            <div>
              <p className="font-medium text-slate-900">{r.title}</p>
              <p className="text-xs text-slate-500">
                Attempt {r.attemptNumber} • {formatDateTime(r.startedAt)}
              </p>
            </div>
          ),
        },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        {
          key: 'score',
          header: 'Score',
          render: (r) =>
            r.result ? (
              <span className="font-semibold">
                {formatScore(r.result.totalScore)} / {formatScore(r.result.maximumMarks)}
                <span className="ml-1 text-xs font-normal text-slate-500">({formatScore(r.result.percentage)}%)</span>
              </span>
            ) : r.status === 'IN_PROGRESS' ? (
              '-'
            ) : (
              <span className="text-xs text-slate-500">Result pending</span>
            ),
        },
        { key: 'accuracy', header: 'Accuracy', render: (r) => (r.result ? `${formatScore(r.result.accuracy)}%` : '-') },
        { key: 'time', header: 'Time', render: (r) => (r.result ? formatDuration(r.result.timeTakenSeconds) : '-') },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (r) =>
            r.status === 'IN_PROGRESS' ? (
              new Date(r.deadlineAt) > new Date() ? (
                <Link to={examUrl(r.id)} className="font-semibold text-accent-600 hover:underline">
                  Resume
                </Link>
              ) : (
                <Link to={resultUrl(r.id)} className="font-semibold text-brand-700 hover:underline">
                  View
                </Link>
              )
            ) : (
              <span className="flex justify-end gap-3">
                <Link to={resultUrl(r.id)} className="font-semibold text-brand-700 hover:underline">
                  Result
                </Link>
                {r.resultVisible && (
                  <Link to={solutionsUrl(r.id)} className="font-semibold text-slate-600 hover:underline">
                    Solutions
                  </Link>
                )}
              </span>
            ),
        },
      ]}
    />
  );
}

