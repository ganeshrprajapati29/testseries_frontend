import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/app/constants';
import { Button, ButtonLink } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authApi } from '../auth.api';
import { resetPasswordSchema, type ResetPasswordForm } from '../auth.schema';
import { AuthCard, FormAlert } from '../components/AuthCard';
import { useServerErrors } from '../hooks/useServerErrors';

export default function ResetPasswordPage({ admin }: { admin?: boolean }) {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirmPassword: '' } });
  const { formError, setFormError, handle } = useServerErrors(setError);
  const loginLink = admin ? ROUTES.adminLogin : ROUTES.login;

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      handle(err);
    }
  });

  if (!token || token.length < 20) {
    return (
      <AuthCard title="Invalid reset link" subtitle="This password reset link is missing or incomplete.">
        <ButtonLink to={admin ? '/admin/forgot-password' : ROUTES.forgotPassword} className="w-full">
          Request a new link
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Your new password must be different from your previous one." footer={<Link to={loginLink} className="font-semibold text-brand-700 hover:underline">Back to sign in</Link>}>
      {done ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="mt-3 text-sm text-slate-600">Your password has been reset. All devices have been signed out.</p>
          <ButtonLink to={loginLink} className="mt-6 w-full">
            Sign in
          </ButtonLink>
        </div>
      ) : (
        <>
          <FormAlert message={formError} />
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Input label="New password" type="password" autoComplete="new-password" hint="At least 8 characters with a letter and a number" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Reset password
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
