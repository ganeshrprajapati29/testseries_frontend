import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { seriesUrl } from '@/app/constants';
import { DataTable } from '@/components/admin/DataTable';
import { SeriesEditor } from '@/components/admin/SeriesEditor';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Badge, PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SearchInput } from '@/components/common/SearchInput';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { adminApi } from '../admin.api';
import type { AdminSeries } from '../admin.types';
import { RowActions } from '../components/RowActions';
import { useAdminMutation } from '../hooks/useAdminMutation';

export default function AdminTestSeriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, get, setFilter, setPage } = usePagination();
  const [editor, setEditor] = useState<{ open: boolean; series?: AdminSeries | null }>({ open: false });
  const [removing, setRemoving] = useState<AdminSeries | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditor({ open: true, series: null });
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const params = { page, limit: 20, search: get('search'), status: get('status'), moduleType: 'TEST_SERIES' };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'series', params], queryFn: () => adminApi.seriesList(params), placeholderData: (p) => p });

  const publish = useAdminMutation(({ id, status }: { id: string; status: string }) => adminApi.seriesPublication(id, status), { success: (s) => `Series ${s.publicationStatus}` });
  const duplicate = useAdminMutation((id: string) => adminApi.duplicateSeries(id), { success: 'Duplicated as draft', onSuccess: (s) => navigate(`/admin/test-series/${s._id}`) });
  const remove = useAdminMutation((id: string) => adminApi.deleteSeries(id), {
    success: (r) => (r.archived ? 'Series archived (it has student activity)' : 'Series deleted'),
    onSuccess: () => setRemoving(null),
  });

  return (
    <div>
      <PageHeader title="Test Series" description="Create series, set pricing and publish them to students." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditor({ open: true, series: null })}>New test series</Button>} />
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
      <DataTable<AdminSeries>
        rows={data?.items}
        meta={data?.meta}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r._id}
        emptyTitle="No test series"
        emptyAction={<Button size="sm" onClick={() => setEditor({ open: true, series: null })}>Create the first series</Button>}
        columns={[
          {
            key: 'title',
            header: 'Series',
            render: (r) => (
              <div>
                <Link to={`/admin/test-series/${r._id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                  {r.title}
                </Link>
                <p className="text-xs text-slate-500">{r.categoryLabel || (typeof r.categoryId === 'object' ? r.categoryId?.name : '')}</p>
              </div>
            ),
          },
          { key: 'tests', header: 'Tests', render: (r) => r.testCount ?? 0 },
          { key: 'students', header: 'Enrolled', render: (r) => r.enrollmentCount ?? 0 },
          { key: 'price', header: 'Access', render: (r) => (r.accessType === 'paid' ? <Badge tone="orange">{formatCurrency(r.price)}</Badge> : <Badge tone="green">Free</Badge>) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.publicationStatus} /> },
          { key: 'updated', header: 'Updated', render: (r) => <span className="text-slate-500">{formatDate(r.updatedAt)}</span> },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r) => (
              <RowActions
                actions={[
                  { label: 'Manage tests', onClick: () => navigate(`/admin/test-series/${r._id}`) },
                  { label: 'Edit details', onClick: () => setEditor({ open: true, series: r }) },
                  { label: 'Publish', onClick: () => publish.mutate({ id: r._id, status: 'published' }), hidden: r.publicationStatus === 'published' },
                  { label: 'Unpublish', onClick: () => publish.mutate({ id: r._id, status: 'unpublished' }), hidden: r.publicationStatus !== 'published' },
                  { label: 'View on site', onClick: () => window.open(seriesUrl(r.slug), '_blank', 'noopener'), hidden: r.publicationStatus !== 'published' },
                  { label: 'Duplicate', onClick: () => duplicate.mutate(r._id) },
                  { label: 'Delete / archive', onClick: () => setRemoving(r), danger: true, hidden: r.publicationStatus === 'archived' },
                ]}
              />
            ),
          },
        ]}
      />
      <SeriesEditor open={editor.open} series={editor.series} onClose={() => setEditor({ open: false })} onSaved={(s) => !editor.series && navigate(`/admin/test-series/${s._id}`)} />
      <ConfirmDialog
        open={!!removing}
        tone="danger"
        title="Delete test series?"
        message={`"${removing?.title}" will be deleted with its tests. If students have attempted or enrolled, it will be archived instead so their history is preserved.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing._id)}
      />
    </div>
  );
}
