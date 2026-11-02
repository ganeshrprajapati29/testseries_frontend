import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/constants';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/components/common/Toast';
import { authApi } from '@/features/auth/auth.api';
import { changePasswordSchema, profileSchema, type ChangePasswordForm, type ProfileForm } from '@/features/auth/auth.schema';
import { FormAlert } from '@/features/auth/components/AuthCard';
import { useServerErrors } from '@/features/auth/hooks/useServerErrors';
import { useAuth } from '@/features/auth/useAuth';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { errorMessage } from '@/services/apiClient';
import { studentApi } from '../student.api';

function ProfileSection() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', mobile: user?.mobile ?? '', preferredLanguage: user?.preferredLanguage ?? 'en' },
  });
  const { formError, setFormError, handle } = useServerErrors(setError);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { user: updated } = await authApi.updateProfile({ ...values, mobile: values.mobile || undefined });
      setUser(updated);
      reset({ name: updated.name, mobile: updated.mobile, preferredLanguage: updated.preferredLanguage });
      toast.success('Profile updated');
    } catch (err) {
      handle(err);
    }
  });

  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold">Profile</h2>
      <p className="text-sm text-slate-500">Member since {formatDate(user?.createdAt)}</p>
      <FormAlert message={formError} />
      <form onSubmit={onSubmit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" value={user?.email ?? ''} disabled hint="Contact support to change your email." readOnly />
        <Input label="Mobile number" type="tel" inputMode="numeric" maxLength={14} required placeholder="10 digit mobile number" error={errors.mobile?.message} {...register('mobile')} />
        <Select
          label="Preferred test language"
          options={[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'Hindi (हिन्दी)' },
          ]}
          {...register('preferredLanguage')}
        />
        <div className="sm:col-span-2">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordSection() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });
  const { formError, setFormError, handle } = useServerErrors(setError);

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setFormError(null);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      reset();
      toast.success(res.message ?? 'Password changed');
    } catch (err) {
      handle(err);
    }
  });

  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold">Change password</h2>
      <p className="text-sm text-slate-500">You will stay signed in on this device; other devices will be signed out.</p>
      <FormAlert message={formError} />
      <form onSubmit={onSubmit} noValidate className="mt-5 grid gap-4 sm:grid-cols-3">
        <Input label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Input label="New password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <div className="sm:col-span-3">
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </div>
      </form>
    </section>
  );
}

function OrdersSection() {
  const { data } = useQuery({ queryKey: ['student', 'orders'], queryFn: studentApi.orders });
  if (!data?.length) return null;
  return (
    <section className="card overflow-hidden">
      <h2 className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 text-lg font-semibold">
        <Receipt className="h-5 w-5 text-brand-600" /> Purchases
      </h2>
      <ul className="divide-y divide-slate-100">
        {data.map((o) => (
          <li key={o._id} className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
            <div>
              <p className="font-medium">{o.testSeriesId?.title ?? 'Test series'}</p>
              <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatCurrency(o.amount, true)}</span>
              <StatusBadge status={o.orderStatus} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const logoutAll = async () => {
    setBusy(true);
    try {
      await authApi.logoutAll();
      await logout();
      navigate(ROUTES.login);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile & Account Settings" />
      <ProfileSection />
      <PasswordSection />
      <OrdersSection />
      <section className="card flex flex-col items-start justify-between gap-3 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Sign out everywhere</h2>
          <p className="text-sm text-slate-500">Ends your sessions on all devices, including this one.</p>
        </div>
        <Button variant="outline" icon={<LogOut className="h-4 w-4" />} onClick={() => setConfirm(true)}>
          Logout from all devices
        </Button>
      </section>
      <ConfirmDialog open={confirm} title="Logout from all devices?" message="You will need to sign in again on every device." confirmLabel="Logout everywhere" tone="danger" loading={busy} onConfirm={logoutAll} onCancel={() => setConfirm(false)} />
    </div>
  );
}
