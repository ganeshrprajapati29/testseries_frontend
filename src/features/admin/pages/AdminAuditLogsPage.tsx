import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/DataTable';
import { Badge, PageHeader } from '@/components/common/Badge';
import { ErrorState } from '@/components/common/ErrorState';
import { SearchInput } from '@/components/common/SearchInput';
import { useAuth } from '@/features/auth/useAuth';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime } from '@/lib/formatters';
import { ApiError } from '@/services/apiClient';
import { adminApi } from '../admin.api';
import type { AuditLog } from '../admin.types';

const ENTITY_TYPES = ['Category', 'TestSeries', 'Test', 'Question', 'ImportJob', 'User', 'Result', 'SiteSetting', 'File'];

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const { page, get, setFilter, setPage } = usePagination();
  const params = { page, limit: 30, entityType: get('entityType'), actor: get('actor') };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'audit', params], queryFn: () => adminApi.auditLogs(params), placeholderData: (p) => p, enabled: user?.role === 'superadmin' });

  if (user?.role !== 'superadmin' || (error instanceof ApiError && error.status === 403)) {
    return <ErrorState error={new Error('Only super admins can view audit logs.')} title="Access restricted" />;
  }

  return (
    <div>
      <PageHeader title="Audit Logs" description="Who changed what, and when. Logs cannot be edited." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={get('actor')} onSearch={(v) => setFilter('actor', v)} placeholder="Filter by admin email..." className="flex-1" />
        <select className="field sm:w-48" value={get('entityType')} onChange={(e) => setFilter('entityType', e.target.value)} aria-label="Entity type">
          <option value="">All entities</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <DataTable<AuditLog>
        rows={data?.items}
        meta={data?.meta}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r._id}
        emptyTitle="No audit entries"
        columns={[
          { key: 'when', header: 'When', render: (r) => <span className="whitespace-nowrap text-slate-500">{formatDateTime(r.createdAt)}</span> },
          {
            key: 'who',
            header: 'Admin',
            render: (r) => (
              <div>
                <p className="font-medium">{r.actorEmail || 'Anonymous'}</p>
                <p className="text-xs text-slate-500">{r.actorRole}</p>
              </div>
            ),
          },
          { key: 'action', header: 'Action', render: (r) => <Badge tone={r.action.includes('delete') || r.action.includes('failed') ? 'red' : 'blue'}>{r.action}</Badge> },
          { key: 'entity', header: 'Entity', render: (r) => <span className="text-xs">{r.entityType}</span> },
          { key: 'summary', header: 'Details', className: 'max-w-md', render: (r) => <span className="text-sm text-slate-600">{r.summary || (r.entityId ? `#${r.entityId}` : '-')}</span> },
          { key: 'ip', header: 'IP', render: (r) => <code className="text-xs text-slate-500">{r.ip}</code> },
        ]}
      />
    </div>
  );
}
