import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { pyqSubjectUrl, ROUTES } from '@/app/constants';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { PaperList } from '../components/PaperList';
import { pyqsApi } from '../pyqs.api';

/** Exam level page, e.g. /pyqs/nda - subjects plus every paper of the exam. */
export default function PYQCategoryPage() {
  const { exam = '' } = useParams();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['pyqs', 'category', exam], queryFn: () => pyqsApi.category(exam) });

  if (isLoading) return <Loader fullScreen />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Exam not found" />
      </div>
    );

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'PYQs', to: ROUTES.pyqs }, { label: data.category.name }]} />
      <h1 className="text-3xl font-bold">{data.category.name} Previous Year Papers</h1>
      <p className="mt-1 text-slate-500">{data.category.description || `Choose a subject or attempt any ${data.category.name} paper below.`}</p>

      {data.children.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.children.map((s) => (
            <CategoryCard key={s._id} to={pyqSubjectUrl(exam, s.slug)} name={s.name} slug={s.slug} subtitle={`${s.paperCount} paper(s)`} compact />
          ))}
        </div>
      )}

      <div className="mt-10">
        <PaperList data={data} showSubject />
      </div>
    </div>
  );
}
