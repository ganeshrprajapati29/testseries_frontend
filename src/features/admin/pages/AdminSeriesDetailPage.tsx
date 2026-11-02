import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, FolderTree, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { seriesUrl } from '@/app/constants';
import { SeriesEditor } from '@/components/admin/SeriesEditor';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { TestEditor } from '@/components/admin/TestEditor';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { formatCurrency, formatDuration, formatScore, TEST_TYPE_LABELS } from '@/lib/formatters';
import { adminApi } from '../admin.api';
import { useAdminMutation } from '../hooks/useAdminMutation';

export default function AdminSeriesDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [newTest, setNewTest] = useState(false);
  const { data: series, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'series', id], queryFn: () => adminApi.series(id) });
  const publish = useAdminMutation((status: string) => adminApi.seriesPublication(id, status), { success: (s) => `Series ${s.publicationStatus}` });
  const reorder = useAdminMutation(({ testId, sortOrder }: { testId: string; sortOrder: number }) => adminApi.updateTest(testId, { sortOrder }));

  if (isLoading) return <Loader />;
  if (error || !series) return <ErrorState error={error} onRetry={() => refetch()} />;

  const tests = series.tests ?? [];
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= tests.length) return;
    const order = [...tests];
    [order[index], order[target]] = [order[target]!, order[index]!];
    order.forEach((t, i) => t.sortOrder !== i && reorder.mutate({ testId: t._id, sortOrder: i }));
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/test-series" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> All test series
      </Link>
      <div className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={series.publicationStatus} />
              {series.accessType === 'paid' ? <Badge tone="orange">{formatCurrency(series.price)}</Badge> : <Badge tone="green">Free</Badge>}
              {series.isFeatured && <Badge tone="purple">Featured</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold">{series.title}</h1>
            {series.hi?.title && (
              <p className="text-sm text-slate-600" lang="hi">
                {series.hi.title}
              </p>
            )}
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-slate-500">
              <FolderTree className="h-3.5 w-3.5" />
              <Link to={`/admin/questions?category=${typeof series.categoryId === 'object' ? series.categoryId._id : series.categoryId}`} className="font-medium text-brand-700 hover:underline" title="Questions in this category">
                {series.categoryLabel || (typeof series.categoryId === 'object' ? series.categoryId.name : '')}
              </Link>
              <span>
                • {tests.length} tests • {series.validityDays} days validity
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {series.publicationStatus === 'published' ? (
              <>
                <Button variant="outline" icon={<ExternalLink className="h-4 w-4" />} onClick={() => window.open(seriesUrl(series.slug), '_blank', 'noopener')}>
                  View
                </Button>
                <Button variant="outline" loading={publish.isPending} onClick={() => publish.mutate('unpublished')}>
                  Unpublish
                </Button>
              </>
            ) : (
              <Button variant="success" loading={publish.isPending} onClick={() => publish.mutate('published')}>
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tests</h2>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setNewTest(true)}>
          Add test
        </Button>
      </div>
      {tests.length ? (
        <div className="card divide-y divide-slate-100">
          {tests.map((t, i) => (
            <div key={t._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button type="button" className="text-xs text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                  ▲
                </button>
                <button type="button" className="text-xs text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={i === tests.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/admin/tests/${t._id}`} className="font-semibold hover:text-brand-700">
                  {t.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {TEST_TYPE_LABELS[t.testType]} •{' '}
                  {t.questionCount ? (
                    <Link to={`/admin/questions?testId=${t._id}`} className="font-semibold text-brand-700 hover:underline" title="View these questions in the Question Bank">
                      {t.questionCount} questions
                    </Link>
                  ) : (
                    <span className="font-semibold text-amber-700">no questions yet</span>
                  )}{' '}
                  • {formatScore(t.totalMarks)} marks • {formatDuration(t.durationSeconds)}
                  {t.isFree && ' • Free'}
                </p>
                {t.categoryLabel && t.categoryLabel !== series.categoryLabel && <p className="text-[11px] text-slate-400">Category: {t.categoryLabel}</p>}
              </div>
              <StatusBadge status={t.publicationStatus} />
              <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/tests/${t._id}`)}>
                Manage
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No tests in this series" message="Add a test, then assign questions from the question bank or import them." action={<Button size="sm" onClick={() => setNewTest(true)}>Add test</Button>} />
      )}

      <SeriesEditor open={editOpen} series={series} onClose={() => setEditOpen(false)} />
      <Modal open={newTest} onClose={() => setNewTest(false)} title="Add test" size="xl">
        <TestEditor moduleType="TEST_SERIES" defaultSeriesId={series._id} onCancel={() => setNewTest(false)} onSaved={(t) => navigate(`/admin/tests/${t._id}`)} />
      </Modal>
    </div>
  );
}
