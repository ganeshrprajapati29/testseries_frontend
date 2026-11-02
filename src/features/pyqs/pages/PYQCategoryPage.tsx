import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { pyqCategoryUrl, ROUTES } from '@/app/constants';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { usePagination } from '@/hooks/usePagination';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { PaperList } from '../components/PaperList';
import { pyqsApi } from '../pyqs.api';

/**
 * Any level of the PYQ tree: /pyqs/nda, /pyqs/nda/maths, /pyqs/capf/2025/history ...
 * Shows the sub-categories of this level plus every paper inside it (including all levels below).
 */
export default function PYQCategoryPage() {
  const params = useParams();
  const path = (params['*'] ?? '').replace(/\/+$/, '');
  const { page, get, setFilter, setPage } = usePagination();
  const year = Number(get('year')) || null;
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['pyqs', 'category', path, year, page],
    queryFn: () => pyqsApi.category(path, { year: year ?? undefined, page, limit: 12 }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Loader fullScreen />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Exam not found" />
      </div>
    );

  const isExam = data.breadcrumb.length <= 1;
  const exam = data.breadcrumb[0];
  const title = isExam ? `${data.category.name} Previous Year Papers` : `${data.breadcrumb.map((b) => b.name).join(' ')} PYQs`;
  const crumbs = [
    { label: 'PYQs', to: ROUTES.pyqs },
    ...data.breadcrumb.slice(0, -1).map((b) => ({ label: b.name, to: pyqCategoryUrl(b.path) })),
    { label: data.category.name },
  ];
  const yearsText = data.years.length ? `${data.paperCount} paper(s) from ${data.years[data.years.length - 1]!.year} to ${data.years[0]!.year}` : `${data.paperCount} paper(s)`;

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-slate-500">
        {data.category.description || (isExam ? `Choose a subject or attempt any ${data.category.name} paper below.` : yearsText)}
        {!isExam && exam && data.category.description ? ` • ${yearsText}` : ''}
      </p>

      {data.children.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Browse {data.category.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.children.map((s) => (
              <CategoryCard key={s._id} to={pyqCategoryUrl(s.path)} name={s.name} slug={s.slug} subtitle={`${s.paperCount} paper(s)`} compact />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <PaperList data={data} showSubject year={year} loading={isFetching} onYear={(y) => setFilter('year', y ? String(y) : '')} onPage={setPage} />
      </div>
    </div>
  );
}
