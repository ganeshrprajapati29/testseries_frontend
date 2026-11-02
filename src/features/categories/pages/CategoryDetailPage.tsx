import { useParams } from 'react-router-dom';
import { categoryUrl } from '@/app/constants';
import { CategoryBreadcrumb } from '@/components/categories/CategoryBreadcrumb';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { CategoryTests } from '@/features/test-series/components/CategoryTests';
import { SeriesResults } from '@/features/test-series/components/SeriesResults';
import { useResolvedCategory } from '../categories.api';

/** Handles every level: /test-series/c/defence, /test-series/c/defence/cds, /test-series/c/defence/cds/gk */
export default function CategoryDetailPage() {
  const params = useParams();
  const path = (params['*'] ?? '').replace(/\/+$/, '');
  const { data, isLoading, error, refetch } = useResolvedCategory('TEST_SERIES', path);

  if (isLoading) return <Loader fullScreen />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        <ErrorState error={error ?? new Error('Category not found')} onRetry={() => refetch()} title="Category not found" />
      </div>
    );

  const { category, breadcrumb, children } = data;

  return (
    <div className="container-page py-8">
      <CategoryBreadcrumb chain={breadcrumb} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{category.name} Test Series</h1>
        {category.description ? <p className="mt-1 max-w-3xl text-slate-500">{category.description}</p> : <p className="mt-1 text-slate-500">All {category.name} test series and mock tests.</p>}
      </div>

      {children.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Browse by {breadcrumb.length > 1 ? 'subject' : 'exam'}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {children.map((c) => (
              <CategoryCard key={c._id} to={categoryUrl(c.path)} name={c.name} slug={c.slug} compact />
            ))}
          </div>
        </div>
      )}

      <CategoryTests categoryId={category._id} categoryName={category.name} />

      <h2 className="mb-3 text-xl font-bold">Test series</h2>
      <SeriesResults categoryId={category._id} />
    </div>
  );
}
