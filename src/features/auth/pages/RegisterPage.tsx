import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/app/constants';
import { Button } from '@/components/common/Button';
import { Checkbox, Input } from '@/components/common/Input';
import { useSettings } from '@/hooks/useSettings';
import { safeRedirect } from '@/lib/utils';
import { registerSchema, type RegisterForm } from '../auth.schema';
import { AuthCard, FormAlert } from '../components/AuthCard';
import { useServerErrors } from '../hooks/useServerErrors';
import { useAuth } from '../useAuth';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', mobile: '', password: '', confirmPassword: '', acceptTerms: false as unknown as true },
  });
  const { formError, setFormError, handle } = useServerErrors(setError);

  const onSubmit = handleSubmit(async ({ name, email, mobile, password }) => {
    setFormError(null);
    try {
      await registerUser({ name, email, mobile, password });
      navigate(safeRedirect(params.get('from'), ROUTES.dashboard), { replace: true });
    } catch (err) {
      handle(err);
    }
  });

  const closed = settings?.registrationOpen === false;

  return (
    <AuthCard
      title="Create your free account"
      subtitle="Attempt free tests, track your progress and review detailed solutions."
      footer={
        <>
          Already have an account?{' '}
          <Link to={`${ROUTES.login}${params.get('from') ? `?from=${encodeURIComponent(params.get('from')!)}` : ''}`} className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {closed && <FormAlert message="New registrations are currently closed. Please check back later." />}
      <FormAlert message={formError} />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
        <Input label="Email address" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
        <Input label="Mobile number" type="tel" autoComplete="tel" inputMode="numeric" maxLength={14} required placeholder="10 digit mobile number" hint="Used for exam updates and account recovery" error={errors.mobile?.message} {...register('mobile')} />
        <Input label="Password" type="password" autoComplete="new-password" required hint="At least 8 characters with a letter and a number" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <div>
          <Checkbox label="I agree to receive exam updates and accept the terms of use." {...register('acceptTerms')} />
          {errors.acceptTerms && <p className="mt-1 text-xs font-medium text-red-600">{errors.acceptTerms.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" variant="accent" loading={isSubmitting} disabled={closed}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
