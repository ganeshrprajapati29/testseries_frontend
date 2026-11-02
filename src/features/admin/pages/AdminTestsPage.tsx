import { useQuery } from '@tanstack/react-query';
import { FolderTree, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CategoryTreeSelect } from '@/components/admin/CategoryPicker';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { TestEditor } from '@/components/admin/TestEditor';
import { PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/common/Modal';
import { SearchInput } from '@/components/common/SearchInput';
import { usePagination } from '@/hooks/usePagination';
import { formatDuration, formatScore, TEST_TYPE_LABELS } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ModuleType } from '@/types';
import { adminApi } from '../admin.api';
import type { AdminTest } from '../admin.types';
import { RowActions } from '../components/RowActions';
import { useAdminMutation } from '../hooks/useAdminMutation';

const idOf = (v: unknown) => (v && typeof v === 'object' ? String((v as { _id: string })._id) : v ? String(v) : '');

/** Reusable test list - used for Test Series tests and for PYQ papers. */
export function TestsTable({ moduleType, categoryId, onCreate }: { moduleType: ModuleType; categoryId?: string; onCreate: () => void }) {
  const navigate = useNavigate();
  const { page, get, setFilter, setPage } = usePagination();
  const [removing, setRemoving] = useState<AdminTest | null>(null);
  // The page can scope the list (e.g. PYQ exam tabs); otherwise the category filter below is used.
  const params = { page, limit: 20, search: get('search'), status: get('status'), moduleType, categoryId: categoryId || get('cat') || undefined };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'tests', params], queryFn: () => adminApi.tests(params), placeholderData: (p) => p });

  const publish = useAdminMutation(({ id, status }: { id: string; status: string }) => adminApi.testPublication(id, status), { success: (t) => `Test ${t.publicationStatus}` });
  const duplicate = useAdminMutation((id: string) => adminApi.duplicateTest(id), { success: 'Duplicated as draft', onSuccess: (t) => navigate(`/admin/tests/${t._id}`) });
  const remove = useAdminMutation((id: string) => adminApi.deleteTest(id), {
    success: (r) => (r.archived ? 'Test archived (it has attempts)' : 'Test deleted'),
    onSuccess: () => setRemoving(null),
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={get('search')} onSearch={(v) => setFilter('search', v)} placeholder="Search by title..." className="flex-1" />
        {!categoryId && (
          <div className="sm:w-80">
            <CategoryTreeSelect label="" value={get('cat')} onChange={(id) => setFilter('cat', id)} moduleType={moduleType} placeholder="All categories" />
          </div>
        )}
        <select className="field sm:w-48" value={get('status')} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status filter">
          <option value="">All (not archived)</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <DataTable<AdminTest>
        rows={data?.items}
        meta={data?.meta}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r._id}
        emptyTitle={moduleType === 'PYQS' ? 'No papers yet' : 'No tests yet'}
        emptyAction={<Button size="sm" onClick={onCreate}>{moduleType === 'PYQS' ? 'Add paper' : 'Create test'}</Button>}
        columns={[
          {
            key: 'title',
            header: moduleType === 'PYQS' ? 'Paper' : 'Test',
            render: (r) => (
              <div>
                <Link to={`/admin/tests/${r._id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                  {r.title}
                </Link>
                {r.series && <p className="text-xs text-slate-500">Series: {r.series.title}</p>}
                {r.autoCategoryId && <p className="text-xs font-medium text-violet-700">Auto practice set - questions sync from the Question Bank</p>}
                <Link
                  to={`/admin/questions?category=${idOf(r.categoryId)}`}
                  title="Open this category in the Question Bank"
                  className={cn('mt-0.5 inline-flex max-w-[320px] items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium', moduleType === 'PYQS' ? 'bg-accent-50 text-accent-800' : 'bg-brand-50 text-brand-800')}
                >
                  <FolderTree className="h-3 w-3 shrink-0" />
                  <span className="truncate">{r.categoryLabel || r.category?.name || 'No category'}</span>
                  {r.paperYear ? <span className="shrink-0">• {r.paperYear}</span> : null}
                </Link>
              </div>
            ),
          },
          { key: 'type', header: 'Type', render: (r) => TEST_TYPE_LABELS[r.testType] ?? r.testType },
          {
            key: 'q',
            header: 'Questions',
            render: (r) =>
              r.questionCount ? (
                <Link to={`/admin/questions?testId=${r._id}`} className="font-semibold text-brand-700 hover:underline" title="View these questions in the Question Bank">
                  {r.questionCount} →
                </Link>
              ) : (
                <Link to={`/admin/tests/${r._id}`} className="text-xs font-semibold text-amber-700 hover:underline">
                  Add questions
                </Link>
              ),
          },
          { key: 'marks', header: 'Marks / Time', render: (r) => `${formatScore(r.totalMarks)} • ${formatDuration(r.durationSeconds)}` },
          { key: 'attempts', header: 'Attempts', render: (r) => r.attemptCount ?? 0 },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.publicationStatus} /> },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r) => (
              <RowActions
                actions={[
                  { label: 'Manage questions', onClick: () => navigate(`/admin/tests/${r._id}`) },
                  { label: 'View in Question Bank', onClick: () => navigate(`/admin/questions?testId=${r._id}`), hidden: !r.questionCount },
                  { label: 'View on website', onClick: () => window.open(moduleType === 'PYQS' ? `/pyqs/paper/${r.slug}` : `/tests/${r.slug}`, '_blank', 'noopener'), hidden: r.publicationStatus !== 'published' },
                  { label: 'Publish', onClick: () => publish.mutate({ id: r._id, status: 'published' }), hidden: r.publicationStatus === 'published' },
                  { label: 'Unpublish', onClick: () => publish.mutate({ id: r._id, status: 'unpublished' }), hidden: r.publicationStatus !== 'published' },
                  { label: 'Duplicate', onClick: () => duplicate.mutate(r._id) },
                  { label: 'Delete / archive', danger: true, onClick: () => setRemoving(r), hidden: r.publicationStatus === 'archived' },
                ]}
              />
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={!!removing}
        tone="danger"
        title="Delete test?"
        message={`"${removing?.title}" will be deleted. If students have attempted it, it will be archived instead so results stay intact. Questions remain in the question bank.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing._id)}
      />
    </>
  );
}

export default function AdminTestsPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  return (
    <div>
      <PageHeader title="Tests" description="All mock tests across every test series." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>New test</Button>} />
      <TestsTable moduleType="TEST_SERIES" onCreate={() => setCreating(true)} />
      <Modal open={creating} onClose={() => setCreating(false)} title="New test" size="xl">
        <TestEditor moduleType="TEST_SERIES" onCancel={() => setCreating(false)} onSaved={(t) => navigate(`/admin/tests/${t._id}`)} />
      </Modal>
    </div>
  );
}
