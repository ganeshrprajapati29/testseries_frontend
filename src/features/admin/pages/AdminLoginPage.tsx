import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { loginSchema, type LoginForm } from '@/features/auth/auth.schema';
import { FormAlert } from '@/features/auth/components/AuthCard';
import { useServerErrors } from '@/features/auth/hooks/useServerErrors';
import { useAuth } from '@/features/auth/useAuth';
import { useSettings } from '@/hooks/useSettings';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const { logoUrl } = useSettings();
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
      await adminLogin(values);
      const from = params.get('from');
      navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true });
    } catch (err) {
      handle(err);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src={logoUrl} alt="Civil Sansad" className="mx-auto h-20 w-20 rounded-full bg-white object-contain p-1" />
          <h1 className="mt-4 flex items-center justify-center gap-2 text-xl font-bold text-white">
            <ShieldCheck className="h-5 w-5 text-accent-400" /> Admin Panel
          </h1>
          <p className="text-sm text-slate-400">Authorised personnel only</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-pop">
          <FormAlert message={formError} />
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Input label="Admin email" type="email" autoComplete="username" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Sign in
            </Button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link to="/admin/forgot-password" className="text-brand-700 hover:underline">
              Forgot password?
            </Link>
            <Link to="/" className="text-slate-500 hover:underline">
              Student site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
