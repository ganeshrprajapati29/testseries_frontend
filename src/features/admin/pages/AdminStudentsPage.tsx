import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { SearchInput } from '@/components/common/SearchInput';
import { usePagination } from '@/hooks/usePagination';
import { formatDate, formatDateTime, formatScore } from '@/lib/formatters';
import { adminApi } from '../admin.api';
import type { AdminStudent } from '../admin.types';
import { useAdminMutation } from '../hooks/useAdminMutation';

function StudentDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'student', id], queryFn: () => adminApi.student(id) });
  const series = useQuery({ queryKey: ['admin', 'series-options', 'all'], queryFn: () => adminApi.seriesList({ limit: 100 }) });
  const [grantSeries, setGrantSeries] = useState('');
  const [statusChange, setStatusChange] = useState<string | null>(null);

  const setStatus = useAdminMutation((s: string) => adminApi.setStudentStatus(id, s), { success: 'Account status updated', onSuccess: () => setStatusChange(null) });
  const grant = useAdminMutation(() => adminApi.grantAccess(id, grantSeries), { success: 'Access granted', onSuccess: () => setGrantSeries('') });
  const revoke = useAdminMutation((seriesId: string) => adminApi.revokeAccess(id, seriesId), { success: 'Access revoked' });

  return (
    <Modal open onClose={onClose} title="Student details" size="xl">
      {isLoading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{data.student.name}</h3>
              <p className="text-sm text-slate-500">
                {data.student.email}
                {data.student.mobile ? ` • ${data.student.mobile}` : ''}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Joined {formatDate(data.student.createdAt)} • Last login {formatDateTime(data.student.lastLoginAt)} • {data.attemptCount} attempts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={data.student.accountStatus} />
              {data.student.accountStatus === 'active' ? (
                <Button size="sm" variant="danger" onClick={() => setStatusChange('suspended')}>
                  Suspend
                </Button>
              ) : (
                <Button size="sm" variant="success" onClick={() => setStatusChange('active')}>
                  Activate
                </Button>
              )}
            </div>
          </div>

          <section>
            <h4 className="mb-2 font-semibold">Test series access</h4>
            {data.enrollments.length ? (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {data.enrollments.map((e) => (
                  <li key={e._id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span>
                      {e.testSeriesId?.title ?? 'Deleted series'} <span className="text-xs text-slate-500">({e.source})</span>
                    </span>
                    <span className="flex items-center gap-3 text-xs text-slate-500">
                      {e.revokedAt ? 'Revoked' : e.expiresAt ? `Till ${formatDate(e.expiresAt)}` : 'No expiry'}
                      {!e.revokedAt && e.testSeriesId && (
                        <button type="button" className="font-semibold text-red-600 hover:underline" onClick={() => revoke.mutate(e.testSeriesId!._id)}>
                          Revoke
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No enrolments.</p>
            )}
            <div className="mt-3 flex gap-2">
              <select className="field flex-1" value={grantSeries} onChange={(e) => setGrantSeries(e.target.value)} aria-label="Series to grant">
                <option value="">Grant access to a series...</option>
                {series.data?.items.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title} ({s.accessType})
                  </option>
                ))}
              </select>
              <Button disabled={!grantSeries} loading={grant.isPending} onClick={() => grant.mutate(undefined)}>
                Grant
              </Button>
            </div>
          </section>

          <section>
            <h4 className="mb-2 font-semibold">Recent results</h4>
            {data.results.length ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.results.map((r) => (
                      <tr key={r._id}>
                        <td>{r.testTitle}</td>
                        <td className="font-semibold">
                          {formatScore(r.totalScore)}/{formatScore(r.maximumMarks)}
                        </td>
                        <td>{formatScore(r.accuracy)}%</td>
                        <td className="text-slate-500">{formatDateTime(r.evaluatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No results yet.</p>
            )}
          </section>
          <ConfirmDialog
            open={!!statusChange}
            tone={statusChange === 'active' ? 'primary' : 'danger'}
            title={statusChange === 'active' ? 'Activate account?' : 'Suspend account?'}
            message={statusChange === 'active' ? 'The student will be able to sign in again.' : 'The student will be signed out everywhere and cannot sign in until reactivated.'}
            confirmLabel={statusChange === 'active' ? 'Activate' : 'Suspend'}
            loading={setStatus.isPending}
            onCancel={() => setStatusChange(null)}
            onConfirm={() => statusChange && setStatus.mutate(statusChange)}
          />
        </div>
      )}
    </Modal>
  );
}

export default function AdminStudentsPage() {
  const { page, get, setFilter, setPage } = usePagination();
  const [selected, setSelected] = useState<string | null>(null);
  const params = { page, limit: 20, search: get('search'), status: get('status') };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'students', params], queryFn: () => adminApi.students(params), placeholderData: (p) => p });

  return (
    <div>
      <PageHeader title="Students" description={data ? `${data.meta.total} registered students` : 'Registered students'} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={get('search')} onSearch={(v) => setFilter('search', v)} placeholder="Search name, email or mobile..." className="flex-1" />
        <select className="field sm:w-44" value={get('status')} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>
      <DataTable<AdminStudent>
        rows={data?.items}
        meta={data?.meta}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r._id}
        emptyTitle="No students found"
        columns={[
          {
            key: 'name',
            header: 'Student',
            render: (r) => (
              <button type="button" className="text-left" onClick={() => setSelected(r._id)}>
                <p className="font-semibold text-slate-900 hover:text-brand-700">{r.name}</p>
                <p className="text-xs text-slate-500">{r.email}</p>
              </button>
            ),
          },
          { key: 'mobile', header: 'Mobile', render: (r) => r.mobile || '-' },
          { key: 'attempts', header: 'Attempts', render: (r) => r.attemptCount ?? 0 },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.accountStatus} /> },
          { key: 'joined', header: 'Joined', render: (r) => <span className="text-slate-500">{formatDate(r.createdAt)}</span> },
          { key: 'login', header: 'Last login', render: (r) => <span className="text-slate-500">{formatDateTime(r.lastLoginAt)}</span> },
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
      {selected && <StudentDetail id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
