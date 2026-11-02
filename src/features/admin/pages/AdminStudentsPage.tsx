import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Ban, CheckCircle2, Copy, Download, KeyRound, Pencil, PhoneOff, RefreshCw, Trash2, UserCheck, UserPlus, Users, UserX, Wand2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { DataTable } from '@/components/admin/DataTable';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Badge, PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/common/Select';
import { useToast } from '@/components/common/Toast';
import { mobileRule, passwordRule } from '@/features/auth/auth.schema';
import { useServerErrors } from '@/features/auth/hooks/useServerErrors';
import { usePagination } from '@/hooks/usePagination';
import { formatDate, formatDateTime, formatScore } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/services/apiClient';
import { adminApi } from '../admin.api';
import type { AdminStudent, StudentFormInput } from '../admin.types';
import { useAdminMutation } from '../hooks/useAdminMutation';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
];
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

/** A readable random password that satisfies the password policy (letters + digits, 10 chars). */
function generatePassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const pick = (set: string, n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (v) => set[v % set.length]).join('');
  return `${pick(letters, 4)}${pick(digits, 2)}${pick(letters, 2)}${pick(digits, 2)}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700', className ?? 'h-9 w-9 text-sm')}>{initials(name) || '?'}</span>;
}

const studentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: mobileRule,
  password: z.string(),
  accountStatus: z.enum(['active', 'suspended', 'deactivated']),
  preferredLanguage: z.enum(['en', 'hi']),
});
type StudentForm = z.infer<typeof studentSchema>;

/** Create (student = undefined) or edit a student. */
function StudentFormModal({ student, onClose }: { student?: AdminStudent; onClose: () => void }) {
  const editing = !!student;
  const schema = editing ? studentSchema : studentSchema.extend({ password: passwordRule });
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: student?.name ?? '',
      email: student?.email ?? '',
      mobile: student?.mobile ?? '',
      password: editing ? '' : generatePassword(),
      accountStatus: (student?.accountStatus as StudentForm['accountStatus']) ?? 'active',
      preferredLanguage: student?.preferredLanguage ?? 'en',
    },
  });
  const { formError, setFormError, handle } = useServerErrors(setError);
  const toast = useToast();
  const save = useAdminMutation(
    ({ password, ...body }: StudentForm) => (editing ? adminApi.updateStudent(student!._id, body as StudentFormInput) : adminApi.createStudent({ ...(body as StudentFormInput), password })),
    { success: editing ? 'Student updated' : 'Student created', silentError: true, onSuccess: onClose },
  );
  const password = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await save.mutateAsync(values);
    } catch (err) {
      handle(err);
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit student' : 'Add student'}
      description={editing ? student!.email : 'Create an account for a student. Share the email and password with them so they can sign in.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="student-form" loading={isSubmitting}>
            {editing ? 'Save changes' : 'Create student'}
          </Button>
        </>
      }
    >
      <form id="student-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{formError}</p>}
        <Input label="Full name" required autoFocus error={errors.name?.message} {...register('name')} />
        <Input label="Email address" type="email" required error={errors.email?.message} {...register('email')} />
        <Input label="Mobile number" type="tel" inputMode="numeric" required maxLength={14} placeholder="10 digit mobile number" error={errors.mobile?.message} {...register('mobile')} />
        {!editing && (
          <div>
            <Input label="Password" required error={errors.password?.message} hint="At least 8 characters with a letter and a number" {...register('password')} />
            <div className="mt-1.5 flex gap-3 text-xs font-semibold text-brand-700">
              <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => setValue('password', generatePassword(), { shouldValidate: true })}>
                <Wand2 className="h-3.5 w-3.5" /> Generate
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:underline"
                onClick={() => navigator.clipboard?.writeText(password).then(() => toast.success('Password copied'), () => toast.error('Could not copy'))}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </div>
        )}
        <Select label="Account status" options={STATUS_OPTIONS} {...register('accountStatus')} />
        <Select label="Preferred language" options={LANGUAGE_OPTIONS} {...register('preferredLanguage')} />
        {editing && (
          <p className="text-xs text-slate-500 sm:col-span-2">
            Suspending or deactivating signs the student out of every device. Use “Reset password” to set a new password.
          </p>
        )}
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ student, onClose }: { student: AdminStudent; onClose: () => void }) {
  const [password, setPassword] = useState(generatePassword);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const reset = useAdminMutation(() => adminApi.resetStudentPassword(student._id, password), { success: 'Password reset - the student was signed out of all devices', silentError: true, onSuccess: onClose });

  const submit = async () => {
    const check = passwordRule.safeParse(password);
    if (!check.success) return setError(check.error.issues[0]?.message ?? 'Invalid password');
    setError(null);
    try {
      await reset.mutateAsync(undefined);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Reset password"
      description={`Set a new password for ${student.name}. Their account is also unlocked.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={reset.isPending}>
            Reset password
          </Button>
        </>
      }
    >
      <Input label="New password" value={password} onChange={(e) => setPassword(e.target.value)} error={error ?? undefined} hint="Share this password with the student securely." />
      <div className="mt-2 flex gap-3 text-xs font-semibold text-brand-700">
        <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => setPassword(generatePassword())}>
          <RefreshCw className="h-3.5 w-3.5" /> Generate another
        </button>
        <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => navigator.clipboard?.writeText(password).then(() => toast.success('Password copied'), () => toast.error('Could not copy'))}>
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
    </Modal>
  );
}

type Action = { kind: 'edit' | 'reset' | 'delete' | 'suspend' | 'activate'; student: AdminStudent };

function StudentDetail({ id, onClose, onAction }: { id: string; onClose: () => void; onAction: (a: Action) => void }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'student', id], queryFn: () => adminApi.student(id) });
  const series = useQuery({ queryKey: ['admin', 'series-options', 'all'], queryFn: () => adminApi.seriesList({ limit: 100 }) });
  const [tab, setTab] = useState<'overview' | 'access' | 'results'>('overview');
  const [grantSeries, setGrantSeries] = useState('');
  const grant = useAdminMutation(() => adminApi.grantAccess(id, grantSeries), { success: 'Access granted', onSuccess: () => setGrantSeries('') });
  const revoke = useAdminMutation((seriesId: string) => adminApi.revokeAccess(id, seriesId), { success: 'Access revoked' });

  const s = data?.student;
  const activeEnrollments = data?.enrollments.filter((e) => !e.revokedAt) ?? [];
  const avg = data?.results.length ? data.results.reduce((t, r) => t + (r.accuracy ?? 0), 0) / data.results.length : null;

  return (
    <Modal open onClose={onClose} title="Student profile" size="xl">
      {isLoading ? (
        <Loader />
      ) : error || !data || !s ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={s.name} className="h-14 w-14 text-lg" />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">{s.name}</h3>
                <p className="truncate text-sm text-slate-600">{s.email}</p>
                <p className="text-sm text-slate-600">{s.mobile ? `+91 ${s.mobile}` : <span className="text-amber-700">No mobile number</span>}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={s.accountStatus} />
              <div className="flex flex-wrap justify-end gap-1.5">
                <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => onAction({ kind: 'edit', student: s })}>
                  Edit
                </Button>
                <Button size="sm" variant="secondary" icon={<KeyRound className="h-3.5 w-3.5" />} onClick={() => onAction({ kind: 'reset', student: s })}>
                  Reset password
                </Button>
                {s.accountStatus === 'active' ? (
                  <Button size="sm" variant="secondary" icon={<Ban className="h-3.5 w-3.5" />} onClick={() => onAction({ kind: 'suspend', student: s })}>
                    Suspend
                  </Button>
                ) : (
                  <Button size="sm" variant="success" icon={<UserCheck className="h-3.5 w-3.5" />} onClick={() => onAction({ kind: 'activate', student: s })}>
                    Activate
                  </Button>
                )}
                <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => onAction({ kind: 'delete', student: s })}>
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-slate-200" role="tablist">
            {(
              [
                ['overview', 'Overview'],
                ['access', `Series access (${activeEnrollments.length})`],
                ['results', `Results (${data.results.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn('-mb-px border-b-2 px-3 py-2 text-sm font-semibold', tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Attempts', data.attemptCount],
                  ['Results', data.results.length],
                  ['Avg. accuracy', avg === null ? '-' : `${formatScore(avg)}%`],
                  ['Active series', activeEnrollments.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[
                  ['Registered', formatDateTime(s.createdAt)],
                  ['Last login', s.lastLoginAt ? formatDateTime(s.lastLoginAt) : 'Never'],
                  ['Preferred language', s.preferredLanguage === 'hi' ? 'Hindi' : 'English'],
                  ['Email verified', s.emailVerifiedAt ? formatDate(s.emailVerifiedAt) : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-slate-100 py-1.5">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {tab === 'access' && (
            <section>
              {data.enrollments.length ? (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {data.enrollments.map((e) => (
                    <li key={e._id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span>
                        {e.testSeriesId ? (
                          <Link to={`/admin/test-series/${e.testSeriesId._id}`} className="font-medium hover:text-brand-700">
                            {e.testSeriesId.title}
                          </Link>
                        ) : (
                          'Deleted series'
                        )}{' '}
                        <Badge tone="gray">{e.source}</Badge>
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
                <p className="text-sm text-slate-500">Not enrolled in any series yet.</p>
              )}
              <div className="mt-3 flex gap-2">
                <select className="field flex-1" value={grantSeries} onChange={(e) => setGrantSeries(e.target.value)} aria-label="Series to grant">
                  <option value="">Grant access to a series...</option>
                  {series.data?.items.map((x) => (
                    <option key={x._id} value={x._id}>
                      {x.title} ({x.accessType})
                    </option>
                  ))}
                </select>
                <Button disabled={!grantSeries} loading={grant.isPending} onClick={() => grant.mutate(undefined)}>
                  Grant
                </Button>
              </div>
            </section>
          )}

          {tab === 'results' && (
            <section>
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
              <Link to={`/admin/results?search=${encodeURIComponent(s.email)}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
                Open in Results →
              </Link>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

function IconAction({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={cn('rounded-lg p-1.5 text-slate-500 hover:bg-slate-100', danger ? 'hover:text-red-600' : 'hover:text-brand-700')}>
      {children}
    </button>
  );
}

export default function AdminStudentsPage() {
  const { page, get, setFilter, setPage } = usePagination();
  const toast = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<{ student?: AdminStudent } | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [exporting, setExporting] = useState(false);
  const filters = { search: get('search'), status: get('status'), sort: get('sort') };
  const params = { page, limit: 20, ...filters };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'students', params], queryFn: () => adminApi.students(params), placeholderData: (p) => p });
  const stats = useQuery({ queryKey: ['admin', 'students', 'stats'], queryFn: adminApi.studentStats });

  const done = () => setAction(null);
  const setStatus = useAdminMutation((v: { id: string; status: string }) => adminApi.setStudentStatus(v.id, v.status), { success: 'Account status updated', onSuccess: done });
  const remove = useAdminMutation((id: string) => adminApi.deleteStudent(id), {
    success: 'Student deleted',
    onSuccess: (_d, id) => {
      done();
      if (selected === id) setSelected(null);
    },
  });

  const exportCsv = async () => {
    setExporting(true);
    try {
      await adminApi.exportStudents(filters);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const st = stats.data;
  const statusTabs = [
    { value: '', label: 'All', count: st?.total },
    { value: 'active', label: 'Active', count: st?.active },
    { value: 'suspended', label: 'Suspended', count: st?.suspended },
    { value: 'deactivated', label: 'Deactivated', count: st?.deactivated },
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        description="Create, edit and manage student accounts, their series access and results."
        actions={
          <>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} loading={exporting} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setForm({})}>
              Add student
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={st?.total ?? '-'} icon={Users} tone="blue" hint={st ? `${st.newThisWeek} joined in the last 7 days` : undefined} />
        <StatCard label="Active accounts" value={st?.active ?? '-'} icon={CheckCircle2} tone="green" hint={st ? `${st.activeThisWeek} signed in this week` : undefined} />
        <StatCard label="Suspended / deactivated" value={st ? st.suspended + st.deactivated : '-'} icon={UserX} tone="red" />
        <StatCard label="Missing mobile number" value={st?.withoutMobile ?? '-'} icon={PhoneOff} tone="orange" hint="Older accounts created before mobile was required" />
      </div>

      <div className="card mb-4 p-3">
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
          {statusTabs.map((t) => (
            <button
              key={t.value || 'all'}
              role="tab"
              aria-selected={filters.status === t.value}
              onClick={() => setFilter('status', t.value)}
              className={cn('rounded-full px-3 py-1 text-sm font-semibold', filters.status === t.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              {t.label}
              {t.count !== undefined && <span className="ml-1.5 opacity-75">{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={filters.search} onSearch={(v) => setFilter('search', v)} placeholder="Search name, email or mobile..." className="flex-1" />
          <select className="field sm:w-48" value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
            <option value="">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A-Z</option>
            <option value="lastLogin">Recently active</option>
          </select>
        </div>
      </div>

      <DataTable<AdminStudent>
        rows={data?.items}
        meta={data?.meta}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r._id}
        emptyTitle={filters.search || filters.status ? 'No students match these filters' : 'No students yet'}
        columns={[
          {
            key: 'name',
            header: 'Student',
            render: (r) => (
              <button type="button" className="flex items-center gap-3 text-left" onClick={() => setSelected(r._id)}>
                <Avatar name={r.name} />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900 hover:text-brand-700">{r.name}</span>
                  <span className="block truncate text-xs text-slate-500">{r.email}</span>
                </span>
              </button>
            ),
          },
          { key: 'mobile', header: 'Mobile', render: (r) => (r.mobile ? <span className="whitespace-nowrap">{r.mobile}</span> : <Badge tone="amber">Missing</Badge>) },
          { key: 'series', header: 'Series', render: (r) => r.enrollmentCount ?? 0 },
          { key: 'attempts', header: 'Attempts', render: (r) => r.attemptCount ?? 0 },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.accountStatus} /> },
          {
            key: 'activity',
            header: 'Activity',
            render: (r) => (
              <div className="text-xs whitespace-nowrap text-slate-500">
                <p>Joined {formatDate(r.createdAt)}</p>
                <p>Last login {r.lastLoginAt ? formatDate(r.lastLoginAt) : 'never'}</p>
              </div>
            ),
          },
          {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            className: 'text-right',
            render: (r) => (
              <div className="flex justify-end gap-0.5">
                <IconAction label={`Edit ${r.name}`} onClick={() => setForm({ student: r })}>
                  <Pencil className="h-4 w-4" />
                </IconAction>
                <IconAction label={`Reset password of ${r.name}`} onClick={() => setAction({ kind: 'reset', student: r })}>
                  <KeyRound className="h-4 w-4" />
                </IconAction>
                {r.accountStatus === 'active' ? (
                  <IconAction label={`Suspend ${r.name}`} onClick={() => setAction({ kind: 'suspend', student: r })} danger>
                    <Ban className="h-4 w-4" />
                  </IconAction>
                ) : (
                  <IconAction label={`Activate ${r.name}`} onClick={() => setAction({ kind: 'activate', student: r })}>
                    <UserCheck className="h-4 w-4" />
                  </IconAction>
                )}
                <IconAction label={`Delete ${r.name}`} onClick={() => setAction({ kind: 'delete', student: r })} danger>
                  <Trash2 className="h-4 w-4" />
                </IconAction>
              </div>
            ),
          },
        ]}
      />

      {selected && <StudentDetail id={selected} onClose={() => setSelected(null)} onAction={(a) => (a.kind === 'edit' ? setForm({ student: a.student }) : setAction(a))} />}
      {form && <StudentFormModal student={form.student} onClose={() => setForm(null)} />}
      {action?.kind === 'reset' && <ResetPasswordModal student={action.student} onClose={done} />}
      <ConfirmDialog
        open={action?.kind === 'suspend' || action?.kind === 'activate'}
        tone={action?.kind === 'activate' ? 'primary' : 'danger'}
        title={action?.kind === 'activate' ? `Activate ${action?.student.name}?` : `Suspend ${action?.student.name}?`}
        message={action?.kind === 'activate' ? 'The student will be able to sign in again.' : 'The student will be signed out everywhere and cannot sign in until reactivated.'}
        confirmLabel={action?.kind === 'activate' ? 'Activate' : 'Suspend'}
        loading={setStatus.isPending}
        onCancel={done}
        onConfirm={() => action && setStatus.mutate({ id: action.student._id, status: action.kind === 'activate' ? 'active' : 'suspended' })}
      />
      <ConfirmDialog
        open={action?.kind === 'delete'}
        tone="danger"
        title={`Delete ${action?.student.name}?`}
        message="This permanently deletes the account with all its attempts, results and series access. It cannot be undone. Students with payment records cannot be deleted - suspend them instead."
        confirmLabel="Delete permanently"
        loading={remove.isPending}
        onCancel={done}
        onConfirm={() => action && remove.mutate(action.student._id)}
      />
    </div>
  );
}
