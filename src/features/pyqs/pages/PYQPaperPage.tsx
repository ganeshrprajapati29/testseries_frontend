import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { pyqExamUrl, pyqSubjectUrl, ROUTES } from '@/app/constants';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { Breadcrumbs, type Crumb } from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/features/auth/useAuth';
import { TestOverview } from '@/features/test-series/components/TestOverview';
import { pyqsApi } from '../pyqs.api';

export default function PYQPaperPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['pyqs', 'paper', slug, user?.id], queryFn: () => pyqsApi.paper(slug) });

  if (isLoading) return <Loader fullScreen />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Paper not available" />
      </div>
    );

  const [exam, subject] = data.breadcrumb;
  const crumbs: Crumb[] = [{ label: 'PYQs', to: ROUTES.pyqs }];
  if (exam) crumbs.push({ label: exam.name, to: pyqExamUrl(exam.slug) });
  if (exam && subject) crumbs.push({ label: subject.name, to: pyqSubjectUrl(exam.slug, subject.slug) });
  crumbs.push({ label: data.title });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={crumbs} />
      <TestOverview test={data} />
    </div>
  );
}
