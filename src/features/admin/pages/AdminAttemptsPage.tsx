import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { QuestionReview } from '@/components/tests/QuestionReview';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime, formatDuration, formatScore } from '@/lib/formatters';
import { adminApi } from '../admin.api';
import type { AdminAttempt } from '../admin.types';

function AttemptDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'attempt', id], queryFn: () => adminApi.attempt(id) });
  return (
    <Modal open onClose={onClose} size="full" title="Attempt details">
      {isLoading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Student</p>
              <p className="font-semibold">{data.attempt.studentId?.name}</p>
              <p className="text-xs text-slate-500">{data.attempt.studentId?.email}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Test</p>
              <p className="font-semibold">{data.attempt.testConfigurationSnapshot?.title}</p>
              <StatusBadge status={data.attempt.status} />
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Score</p>
              <p className="text-xl font-bold">{data.result ? `${formatScore(data.result.totalScore)}/${formatScore(data.result.maximumMarks)}` : '-'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Timing</p>
              <p className="text-sm">Started {formatDateTime(data.attempt.startedAt)}</p>
              <p className="text-sm">{data.result ? `Took ${formatDuration(data.result.timeTakenSeconds)}` : `Deadline ${formatDateTime(data.attempt.deadlineAt)}`}</p>
            </div>
          </div>
          {data.solutions ? (
            <div className="space-y-4">
              {data.solutions.questions.map((q) => (
                <QuestionReview key={q.number} q={q} language={data.solutions!.language} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">This attempt is still in progress.</p>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AdminAttemptsPage() {
  const { page, get, setFilter, setPage } = usePagination();
  const [selected, setSelected] = useState<string | null>(null);
  const params = { page, limit: 25, status: get('status') };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'attempts', params], queryFn: () => adminApi.attempts(params), placeholderData: (p) => p });

  return (
    <div>
      <PageHeader title="Attempts" description="Every test attempt, including ones in progress." />
      <div className="mb-4">
        <select className="field sm:w-56" value={get('status')} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="AUTO_SUBMITTED">Auto-submitted</option>
        </select>
      </div>
      <DataTable<AdminAttempt>
        rows={data?.items}
        meta={data?.meta}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r._id}
        emptyTitle="No attempts yet"
        columns={[
          {
            key: 'student',
            header: 'Student',
            render: (r) => (
              <div>
                <p className="font-medium">{r.studentId?.name ?? 'Deleted user'}</p>
                <p className="text-xs text-slate-500">{r.studentId?.email}</p>
              </div>
            ),
          },
          { key: 'test', header: 'Test', render: (r) => `${r.testConfigurationSnapshot?.title ?? ''} (#${r.attemptNumber})` },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'score', header: 'Score', render: (r) => (r.finalScore !== null ? `${formatScore(r.finalScore)}/${formatScore(r.scoringConfigurationSnapshot?.maximumMarks)}` : '-') },
          { key: 'started', header: 'Started', render: (r) => <span className="text-slate-500">{formatDateTime(r.startedAt)}</span> },
          { key: 'submitted', header: 'Submitted', render: (r) => <span className="text-slate-500">{formatDateTime(r.submittedAt)}</span> },
          {
            key: 'view',
            header: '',
            className: 'text-right',
            render: (r) => (
              <Button size="sm" variant="secondary" onClick={() => setSelected(r._id)}>
                View
              </Button>
            ),
          },
        ]}
      />
      {selected && <AttemptDetail id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
