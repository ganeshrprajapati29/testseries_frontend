import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { pyqExamUrl, ROUTES } from '@/app/constants';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { PaperList } from '../components/PaperList';
import { pyqsApi } from '../pyqs.api';

/** Subject level page, e.g. /pyqs/nda/maths - papers grouped by year. */
export default function PYQSubjectPage() {
  const { exam = '', subject = '' } = useParams();
  const path = `${exam}/${subject}`;
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['pyqs', 'category', path], queryFn: () => pyqsApi.category(path) });

  if (isLoading) return <Loader fullScreen />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Subject not found" />
      </div>
    );

  const examCrumb = data.breadcrumb[0];
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'PYQs', to: ROUTES.pyqs }, { label: examCrumb?.name ?? exam, to: pyqExamUrl(exam) }, { label: data.category.name }]} />
      <h1 className="text-3xl font-bold">
        {examCrumb?.name} {data.category.name} PYQs
      </h1>
      <p className="mt-1 text-slate-500">{data.years.length ? `Papers from ${data.years[data.years.length - 1]} to ${data.years[0]}` : 'Year-wise previous year papers'}</p>
      <div className="mt-8">
        <PaperList data={data} />
      </div>
    </div>
  );
}
