import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CategoryBreadcrumb } from '@/components/categories/CategoryBreadcrumb';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/features/auth/useAuth';
import { TestOverview } from '../components/TestOverview';
import { testSeriesApi } from '../testSeries.api';

export default function TestDetailPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['test', slug, user?.id], queryFn: () => testSeriesApi.test(slug) });

  if (isLoading) return <Loader fullScreen />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Test not available" />
      </div>
    );

  return (
    <div className="container-page py-8">
      <CategoryBreadcrumb chain={data.breadcrumb} current={data.title} />
      <TestOverview test={data} />
    </div>
  );
}
