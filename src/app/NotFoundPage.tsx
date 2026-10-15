import { SearchX } from 'lucide-react';
import { ButtonLink } from '@/components/common/Button';

export default function NotFoundPage({ admin }: { admin?: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <SearchX className="h-14 w-14 text-brand-300" />
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-500">The page you are looking for does not exist or may have been moved.</p>
      <div className="mt-6 flex gap-3">
        <ButtonLink to={admin ? '/admin' : '/'}>{admin ? 'Admin dashboard' : 'Go home'}</ButtonLink>
        {!admin && (
          <ButtonLink to="/test-series" variant="outline">
            Browse test series
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
