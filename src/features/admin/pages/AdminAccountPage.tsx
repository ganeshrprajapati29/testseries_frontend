import { useQuery } from '@tanstack/react-query';
import { Copy, KeyRound, Mail, Pencil, ShieldCheck, UserCog, UserPlus, Wand2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Badge, PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { useToast } from '@/components/common/Toast';
import { authApi } from '@/features/auth/auth.api';
import { passwordRule } from '@/features/auth/auth.schema';
import { useAuth } from '@/features/auth/useAuth';
import { formatDateTime } from '@/lib/formatters';
import { ApiError, errorMessage } from '@/services/apiClient';
import { adminApi } from '../admin.api';
import type { AdminAccount, AdminRole } from '../admin.types';
import { useAdminMutation } from '../hooks/useAdminMutation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generatePassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const pick = (set: string, n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (v) => set[v % set.length]).join('');
  return `${pick(letters, 4)}${pick(digits, 2)}${pick(letters, 3)}${pick(digits, 2)}`;
}

/** Field errors from the API ("body.newEmail" -> "newEmail") plus a general message. */
function apiErrors(err: unknown): { fields: Record<string, string>; message: string | null } {
  if (err instanceof ApiError && err.details.length) {
    const fields = err.fieldErrors();
    return { fields, message: Object.keys(fields).length ? null : err.message };
  }
  return { fields: {}, message: errorMessage(err) };
}

function Card({ icon: Icon, title, description, children }: { icon: typeof Mail; title: string; description: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ProfileForm() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Name must be at least 2 characters');
    setBusy(true);
    setError(null);
    try {
      await authApi.updateProfile({ name: name.trim() });
      await refresh();
      toast.success('Name updated');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
      <div className="flex-1">
        <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} error={error ?? undefined} />
      </div>
      <Button type="submit" loading={busy} disabled={name.trim() === user?.name}>
        Save name
      </Button>
    </form>
  );
}

function EmailForm() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!EMAIL_RE.test(newEmail.trim())) next.newEmail = 'Enter a valid email address';
    if (!currentPassword) next.currentPassword = 'Enter your current password to confirm';
    setErrors(next);
    setMessage(null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const res = await authApi.changeEmail(currentPassword, newEmail.trim());
      await refresh();
      toast.success(res.message ?? 'Email changed');
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      const r = apiErrors(err);
      setErrors(r.fields);
      setMessage(r.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <p className="text-sm">
        Current login email: <span className="font-semibold">{user?.email}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="New email" type="email" autoComplete="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} error={errors.newEmail} />
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={errors.currentPassword}
        />
      </div>
      {message && <p className="text-sm font-medium text-red-600">{message}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">You stay signed in here; other devices are signed out.</p>
        <Button type="submit" loading={busy}>
          Change email
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [v, setV] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!v.currentPassword) next.currentPassword = 'Current password is required';
    const rule = passwordRule.safeParse(v.newPassword);
    if (!rule.success) next.newPassword = rule.error.issues[0]?.message ?? 'Invalid password';
    if (v.newPassword !== v.confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    setMessage(null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const res = await authApi.changePassword(v.currentPassword, v.newPassword);
      toast.success(res.message ?? 'Password changed');
      setV({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      const r = apiErrors(err);
      setErrors(r.fields);
      setMessage(r.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Current password" type="password" autoComplete="current-password" required value={v.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
        <Input label="New password" type="password" autoComplete="new-password" required value={v.newPassword} onChange={set('newPassword')} error={errors.newPassword} hint="8+ characters with a letter and a number" />
        <Input label="Confirm new password" type="password" autoComplete="new-password" required value={v.confirm} onChange={set('confirm')} error={errors.confirm} />
      </div>
      {message && <p className="text-sm font-medium text-red-600">{message}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">Other devices are signed out after the change.</p>
        <Button type="submit" loading={busy}>
          Change password
        </Button>
      </div>
    </form>
  );
}

// ---------------- super admin: admin accounts ----------------

function AdminFormModal({ admin, onClose }: { admin?: AdminAccount; onClose: () => void }) {
  const editing = !!admin;
  const toast = useToast();
  const [v, setV] = useState({ name: admin?.name ?? '', email: admin?.email ?? '', role: (admin?.role ?? 'admin') as AdminRole, accountStatus: admin?.accountStatus ?? 'active', password: editing ? '' : generatePassword() });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const save = useAdminMutation(
    () =>
      editing
        ? adminApi.updateAdmin(admin!._id, { name: v.name.trim(), email: v.email.trim(), role: v.role, accountStatus: v.accountStatus })
        : adminApi.createAdmin({ name: v.name.trim(), email: v.email.trim(), password: v.password, role: v.role }),
    { success: editing ? 'Admin updated' : 'Admin created - share the email and password with them', silentError: true, onSuccess: onClose },
  );
  const submit = async () => {
    const next: Record<string, string> = {};
    if (v.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!EMAIL_RE.test(v.email.trim())) next.email = 'Enter a valid email address';
    if (!editing) {
      const rule = passwordRule.safeParse(v.password);
      if (!rule.success) next.password = rule.error.issues[0]?.message ?? 'Invalid password';
    }
    setErrors(next);
    setMessage(null);
    if (Object.keys(next).length) return;
    try {
      await save.mutateAsync(undefined);
    } catch (err) {
      const r = apiErrors(err);
      setErrors(r.fields);
      setMessage(r.message);
    }
  };
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit admin' : 'Add admin'}
      description={editing ? 'Changing the email, role or status signs this admin out everywhere.' : 'Creates a login for the admin panel.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {editing ? 'Save' : 'Create admin'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" required value={v.name} onChange={set('name')} error={errors.name} />
        <Input label="Login email" type="email" required value={v.email} onChange={set('email')} error={errors.email} />
        {!editing && (
          <div className="sm:col-span-2">
            <Input label="Password" required value={v.password} onChange={set('password')} error={errors.password} />
            <div className="mt-1.5 flex gap-3 text-xs font-semibold text-brand-700">
              <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => setV((p) => ({ ...p, password: generatePassword() }))}>
                <Wand2 className="h-3.5 w-3.5" /> Generate
              </button>
              <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => navigator.clipboard?.writeText(v.password).then(() => toast.success('Password copied'))}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </div>
        )}
        <Select
          label="Role"
          value={v.role}
          onChange={set('role')}
          options={[
            { value: 'admin', label: 'Admin - content, students, results' },
            { value: 'superadmin', label: 'Super admin - everything incl. settings & admins' },
          ]}
        />
        {editing && (
          <Select
            label="Status"
            value={v.accountStatus}
            onChange={set('accountStatus')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended (cannot sign in)' },
            ]}
          />
        )}
      </div>
      {(message || errors._) && <p className="mt-3 text-sm font-medium text-red-600">{message ?? errors._}</p>}
    </Modal>
  );
}

function ResetAdminPasswordModal({ admin, onClose }: { admin: AdminAccount; onClose: () => void }) {
  const toast = useToast();
  const [password, setPassword] = useState(generatePassword);
  const [error, setError] = useState<string | null>(null);
  const reset = useAdminMutation(() => adminApi.resetAdminPassword(admin._id, password), { success: 'Password reset - the admin was signed out everywhere', silentError: true, onSuccess: onClose });
  const submit = async () => {
    const rule = passwordRule.safeParse(password);
    if (!rule.success) return setError(rule.error.issues[0]?.message ?? 'Invalid password');
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
      title="Reset admin password"
      description={`Set a new password for ${admin.name} (${admin.email}). Share it with them securely.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={reset.isPending}>
            Reset password
          </Button>
        </>
      }
    >
      <Input label="New password" value={password} onChange={(e) => setPassword(e.target.value)} error={error ?? undefined} />
      <div className="mt-2 flex gap-3 text-xs font-semibold text-brand-700">
        <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => setPassword(generatePassword())}>
          <Wand2 className="h-3.5 w-3.5" /> Generate another
        </button>
        <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => navigator.clipboard?.writeText(password).then(() => toast.success('Password copied'))}>
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
    </Modal>
  );
}

function AdminAccounts() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'admins'], queryFn: adminApi.admins });
  const [form, setForm] = useState<{ admin?: AdminAccount } | null>(null);
  const [resetting, setResetting] = useState<AdminAccount | null>(null);

  return (
    <Card icon={ShieldCheck} title="Admin accounts" description="Add admins, change their login email or reset a forgotten password. Only super admins see this.">
      <div className="mb-3 flex justify-end">
        <Button size="sm" icon={<UserPlus className="h-4 w-4" />} onClick={() => setForm({})}>
          Add admin
        </Button>
      </div>
      {isLoading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {data.map((a) => {
            const me = a._id === user?.id;
            return (
              <li key={a._id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {a.name} {me && <Badge tone="blue">You</Badge>}
                    <Badge tone={a.role === 'superadmin' ? 'purple' : 'gray'}>{a.role === 'superadmin' ? 'Super admin' : 'Admin'}</Badge>
                    {a.accountStatus !== 'active' && <StatusBadge status={a.accountStatus} />}
                  </p>
                  <p className="truncate text-sm text-slate-600">{a.email}</p>
                  <p className="text-xs text-slate-400">Last login {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : 'never'}</p>
                </div>
                {!me && (
                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="outline" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setForm({ admin: a })}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" icon={<KeyRound className="h-3.5 w-3.5" />} onClick={() => setResetting(a)}>
                      Reset password
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {form && <AdminFormModal admin={form.admin} onClose={() => setForm(null)} />}
      {resetting && <ResetAdminPasswordModal admin={resetting} onClose={() => setResetting(null)} />}
    </Card>
  );
}

export default function AdminAccountPage() {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="My Account" description="Your admin login: name, email and password." />
      <Card icon={UserCog} title="Profile" description="The name shown in the admin panel and audit logs.">
        <ProfileForm />
      </Card>
      <Card icon={Mail} title="Login email" description="The email you use to sign in to the admin panel.">
        <EmailForm />
      </Card>
      <Card icon={KeyRound} title="Change password" description="Use a strong password that you do not use anywhere else.">
        <PasswordForm />
      </Card>
      {user?.role === 'superadmin' ? (
        <AdminAccounts />
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Forgot your password? Ask a super admin to reset it from <b>My Account → Admin accounts</b>.</p>
      )}
    </div>
  );
}
