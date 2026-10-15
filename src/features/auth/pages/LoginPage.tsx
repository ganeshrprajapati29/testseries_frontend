import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/app/constants';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { safeRedirect } from '@/lib/utils';
import { loginSchema, type LoginForm } from '../auth.schema';
import { AuthCard, FormAlert } from '../components/AuthCard';
import { useServerErrors } from '../hooks/useServerErrors';
import { useAuth } from '../useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const { formError, setFormError, handle } = useServerErrors(setError);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      navigate(safeRedirect(params.get('from'), ROUTES.dashboard), { replace: true });
    } catch (err) {
      handle(err);
    }
  });

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your preparation."
      footer={
        <>
          New to Civil Sansad?{' '}
          <Link to={`${ROUTES.register}${params.get('from') ? `?from=${encodeURIComponent(params.get('from')!)}` : ''}`} className="font-semibold text-brand-700 hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <FormAlert message={formError} />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="flex justify-end">
          <Link to={ROUTES.forgotPassword} className="text-sm font-medium text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
