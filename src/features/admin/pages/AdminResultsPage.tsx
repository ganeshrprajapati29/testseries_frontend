import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { useToast } from '@/components/common/Toast';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime, formatDuration, formatScore } from '@/lib/formatters';
import { errorMessage } from '@/services/apiClient';
import { adminApi } from '../admin.api';
import type { AdminResult } from '../admin.types';

const toIsoStart = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined);
const toIsoEnd = (d: string) => (d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined);

export default function AdminResultsPage() {
  const toast = useToast();
  const { page, get, setFilter, setPage } = usePagination();
  const [exporting, setExporting] = useState(false);
  const tests = useQuery({ queryKey: ['admin', 'tests', 'result-options'], queryFn: () => adminApi.tests({ limit: 100, status: 'published' }) });

  const filters = { testId: get('testId'), search: get('search'), from: toIsoStart(get('from')), to: toIsoEnd(get('to')) };
  const params = { page, limit: 25, ...filters };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'results', params], queryFn: () => adminApi.results(params), placeholderData: (p) => p });

  const exportCsv = async () => {
    setExporting(true);
    try {
      await adminApi.exportResults({ testId: filters.testId, from: filters.from, to: filters.to });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Results"
        description="Evaluated results. Filter by test and date, or export to CSV."
        actions={
          <Button variant="outline" icon={<Download className="h-4 w-4" />} loading={exporting} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput value={get('search')} onSearch={(v) => setFilter('search', v)} placeholder="Student name or email..." />
        <select className="field" value={get('testId')} onChange={(e) => setFilter('testId', e.target.value)} aria-label="Test">
          <option value="">All tests</option>
          {tests.data?.items.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title}
            </option>
          ))}
        </select>
        <input type="date" className="field" value={get('from')} onChange={(e) => setFilter('from', e.target.value)} aria-label="From date" />
        <input type="date" className="field" value={get('to')} onChange={(e) => setFilter('to', e.target.value)} aria-label="To date" />
      </div>
      <DataTable<AdminResult>
        rows={data?.items}
        meta={data?.meta}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r._id}
        emptyTitle="No results match these filters"
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
          { key: 'test', header: 'Test', render: (r) => r.testTitle },
          {
            key: 'score',
            header: 'Score',
            render: (r) => (
              <span className="font-semibold">
                {formatScore(r.totalScore)}/{formatScore(r.maximumMarks)} <span className="text-xs font-normal text-slate-500">({formatScore(r.percentage)}%)</span>
              </span>
            ),
          },
          { key: 'cia', header: 'C / I / U', render: (r) => `${r.correctCount} / ${r.incorrectCount} / ${r.unansweredCount}` },
          { key: 'acc', header: 'Accuracy', render: (r) => `${formatScore(r.accuracy)}%` },
          { key: 'time', header: 'Time', render: (r) => formatDuration(r.timeTakenSeconds) },
          { key: 'date', header: 'Evaluated', render: (r) => <span className="text-slate-500">{formatDateTime(r.evaluatedAt)}</span> },
        ]}
      />
    </div>
  );
}
