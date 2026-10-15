import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import type { ModuleType } from '@/types';
import { adminApi } from '../admin.api';
import type { AdminTest } from '../admin.types';
import { RowActions } from '../components/RowActions';
import { useAdminMutation } from '../hooks/useAdminMutation';

/** Reusable test list - used for Test Series tests and for PYQ papers. */
export function TestsTable({ moduleType, categoryId, onCreate }: { moduleType: ModuleType; categoryId?: string; onCreate: () => void }) {
  const navigate = useNavigate();
  const { page, get, setFilter, setPage } = usePagination();
  const [removing, setRemoving] = useState<AdminTest | null>(null);
  const params = { page, limit: 20, search: get('search'), status: get('status'), moduleType, categoryId };
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
                <p className="text-xs text-slate-500">
                  {r.series?.title ?? r.category?.name}
                  {r.paperYear ? ` • ${r.paperYear}` : ''}
                </p>
              </div>
            ),
          },
          { key: 'type', header: 'Type', render: (r) => TEST_TYPE_LABELS[r.testType] ?? r.testType },
          { key: 'q', header: 'Questions', render: (r) => r.questionCount ?? 0 },
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
