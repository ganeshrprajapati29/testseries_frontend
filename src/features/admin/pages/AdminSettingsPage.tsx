import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Input, Textarea } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/features/auth/useAuth';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { ApiError } from '@/services/apiClient';
import { adminApi } from '../admin.api';
import type { AdminOrder } from '../admin.types';
import { Toggle } from '../components/formHelpers';
import { useAdminMutation } from '../hooks/useAdminMutation';

const GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Branding & home page', keys: ['siteName', 'tagline', 'logoUrl', 'heroTitle', 'heroSubtitle', 'announcement', 'mainWebsiteUrl'] },
  { title: 'Contact details', keys: ['contactPhone', 'whatsappNumber', 'contactEmail', 'address'] },
  { title: 'Social media', keys: ['facebookUrl', 'instagramUrl', 'youtubeUrl'] },
  { title: 'Exams & registration', keys: ['defaultExamInstructions', 'registrationOpen'] },
];
const LONG = new Set(['heroSubtitle', 'defaultExamInstructions', 'address']);

function OrdersSection() {
  const { page, setPage } = usePagination();
  const config = useQuery({ queryKey: ['admin', 'payment-config'], queryFn: adminApi.paymentConfig });
  const orders = useQuery({ queryKey: ['admin', 'orders', page], queryFn: () => adminApi.orders({ page, limit: 10 }) });
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <CreditCard className="h-5 w-5 text-brand-600" /> Payments
      </h2>
      <p className="text-sm text-slate-600">
        Online payments are <b>{config.data?.enabled ? 'enabled (Razorpay)' : 'disabled'}</b>. Payment keys are configured on the server through environment variables, never in the browser.
      </p>
      <DataTable<AdminOrder>
        rows={orders.data?.items}
        meta={orders.data?.meta}
        onPageChange={setPage}
        isLoading={orders.isLoading}
        error={orders.error}
        rowKey={(r) => r._id}
        emptyTitle="No orders yet"
        columns={[
          { key: 'student', header: 'Student', render: (r) => r.studentId?.email ?? '-' },
          { key: 'series', header: 'Series', render: (r) => r.testSeriesId?.title ?? '-' },
          { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount, true) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.orderStatus} /> },
          { key: 'ref', header: 'Gateway order', render: (r) => <code className="text-xs">{r.providerOrderId}</code> },
          { key: 'date', header: 'Date', render: (r) => formatDateTime(r.createdAt) },
        ]}
      />
    </section>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'superadmin';
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.settings });
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setValues(data.values);
  }, [data]);

  const save = useAdminMutation((v: Record<string, unknown>) => adminApi.updateSettings(v), {
    success: 'Settings saved',
    invalidate: [['admin'], ['settings']],
    silentError: true,
    onSuccess: () => setFieldErrors({}),
  });

  if (isLoading) return <Loader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => refetch()} />;

  const describe = (key: string) => data.descriptors.find((d) => d.key === key)?.description ?? key;
  const changed = Object.fromEntries(Object.entries(values).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(data.values[k])));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description={canEdit ? 'Site-wide content shown on the student website.' : 'Only super admins can change settings.'}
        actions={
          canEdit && (
            <Button
              disabled={!Object.keys(changed).length}
              loading={save.isPending}
              onClick={() =>
                save.mutate(changed, {
                  onError: (err) => setFieldErrors(err instanceof ApiError ? err.fieldErrors() : { _: String(err) }),
                })
              }
            >
              Save changes
            </Button>
          )
        }
      />
      {save.isError && !Object.keys(fieldErrors).length && <p className="text-sm text-red-600">Could not save settings.</p>}
      {GROUPS.map((g) => (
        <section key={g.title} className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">{g.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {g.keys.map((key) => {
              const v = values[key];
              if (typeof data.values[key] === 'boolean') {
                return (
                  <div key={key} className="md:col-span-2">
                    <Toggle checked={Boolean(v)} onChange={(c) => canEdit && setValues({ ...values, [key]: c })} label={describe(key)} />
                  </div>
                );
              }
              const common = {
                label: describe(key),
                value: String(v ?? ''),
                disabled: !canEdit,
                error: fieldErrors[key],
              };
              return LONG.has(key) ? (
                <div key={key} className="md:col-span-2">
                  <Textarea {...common} rows={key === 'defaultExamInstructions' ? 7 : 3} hint={key === 'defaultExamInstructions' ? 'One instruction per line' : undefined} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                </div>
              ) : (
                <Input key={key} {...common} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
              );
            })}
          </div>
        </section>
      ))}
      <OrdersSection />
    </div>
  );
}
