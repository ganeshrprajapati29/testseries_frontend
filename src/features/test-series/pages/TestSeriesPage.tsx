import { useNavigate } from 'react-router-dom';
import { categoryUrl } from '@/app/constants';
import { CategoryTree } from '@/components/categories/CategoryTree';
import { Skeleton } from '@/components/common/Skeleton';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useCategoryTree } from '@/features/categories/categories.api';
import { SeriesResults } from '../components/SeriesResults';

export default function TestSeriesPage() {
  const tree = useCategoryTree('TEST_SERIES');
  const navigate = useNavigate();

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Test Series' }]} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Test Series</h1>
        <p className="mt-1 text-slate-500">Full-length mocks, sectional tests and subject-wise practice for every exam.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-3">
            <h2 className="px-2 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Exams</h2>
            {tree.isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 7 }, (_, i) => (
                  <Skeleton key={i} className="h-6" />
                ))}
              </div>
            ) : (
              <CategoryTree nodes={tree.data ?? []} onSelect={(n) => n && navigate(categoryUrl(n.path))} />
            )}
          </div>
        </aside>
        <SeriesResults />
      </div>
    </div>
  );
}
