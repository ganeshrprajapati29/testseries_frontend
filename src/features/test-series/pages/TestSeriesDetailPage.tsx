import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, FileText, Languages } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { CategoryBreadcrumb } from '@/components/categories/CategoryBreadcrumb';
import { Badge } from '@/components/common/Badge';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/features/auth/useAuth';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { EnrollButton } from '../components/EnrollButton';
import { SeriesTests } from '../components/SeriesTests';
import { testSeriesApi } from '../testSeries.api';

export default function TestSeriesDetailPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { data: series, isLoading, error, refetch } = useQuery({ queryKey: ['series', 'detail', slug, user?.id], queryFn: () => testSeriesApi.detail(slug) });

  if (isLoading) return <Loader fullScreen />;
  if (error || !series)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Test series not available" />
      </div>
    );

  const freeCount = series.freeTestCount;
  const discount = series.accessType === 'paid' && series.mrp > series.price ? Math.round(((series.mrp - series.price) / series.mrp) * 100) : 0;

  return (
    <div className="pb-8">
      <div className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="container-page py-8">
          <div className="[&_a]:text-brand-100 [&_nav_span]:text-white [&_svg]:text-brand-200">
            <CategoryBreadcrumb chain={series.breadcrumb} current={series.title} />
          </div>
          <div className="flex flex-wrap gap-2">
            {series.accessType === 'free' ? <Badge tone="green">Free</Badge> : <Badge tone="orange">Premium</Badge>}
            {series.examName && <Badge tone="blue">{series.examName}</Badge>}
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">{series.title}</h1>
          {series.hi?.title && (
            <p lang="hi" className="mt-1 max-w-3xl text-lg text-brand-100">
              {series.hi.title}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-100">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> {series.totalTests} tests {freeCount > 0 && series.accessType === 'paid' && `(${freeCount} free)`}
            </span>
            <span className="flex items-center gap-1.5">
              <Languages className="h-4 w-4" /> {series.languageOptions.map((l) => (l === 'hi' ? 'Hindi' : 'English')).join(' & ')}
            </span>
            {series.accessType === 'paid' && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> {series.validityDays} days validity
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {series.description && (
            <section className="card p-5">
              <h2 className="mb-2 text-lg font-semibold">About this test series</h2>
              <p className="prose-text text-sm text-slate-700">{series.description}</p>
              {series.highlights.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {series.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {h}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <SeriesTests series={series} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4 p-5">
            {series.coverImage && <img src={series.coverImage} alt="" className="h-40 w-full rounded-lg object-cover" />}
            {series.accessType === 'paid' ? (
              <div>
                <span className="text-3xl font-extrabold">{formatCurrency(series.price)}</span>
                {discount > 0 && (
                  <>
                    <span className="ml-2 text-slate-400 line-through">{formatCurrency(series.mrp)}</span>
                    <span className="ml-2 text-sm font-semibold text-emerald-600">{discount}% off</span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-3xl font-extrabold text-emerald-600">Free</p>
            )}
            <EnrollButton series={series} />
            {series.enrollmentExpiresAt && <p className="text-center text-xs text-slate-500">Access valid till {formatDate(series.enrollmentExpiresAt)}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
