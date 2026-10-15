import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/constants';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authApi } from '../auth.api';
import { forgotPasswordSchema, type ForgotPasswordForm } from '../auth.schema';
import { AuthCard, FormAlert } from '../components/AuthCard';
import { useServerErrors } from '../hooks/useServerErrors';

export default function ForgotPasswordPage({ admin }: { admin?: boolean }) {
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });
  const { formError, setFormError, handle } = useServerErrors(setError);

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      const res = await authApi.forgotPassword(email);
      setSent(res.message ?? 'If an account exists for this email, a reset link has been sent.');
    } catch (err) {
      handle(err);
    }
  });

  const loginLink = admin ? ROUTES.adminLogin : ROUTES.login;

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your registered email and we will send you a link to reset it."
      footer={
        <Link to={loginLink} className="font-semibold text-brand-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="mt-3 text-sm text-slate-600">{sent}</p>
          <p className="mt-2 text-xs text-slate-500">The link is valid for 30 minutes. Check your spam folder if you do not see it.</p>
        </div>
      ) : (
        <>
          <FormAlert message={formError} />
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Input label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Send reset link
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
