import { useQuery } from '@tanstack/react-query';
import { ChevronRight, NotebookTabs } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pyqExamUrl, pyqSubjectUrl } from '@/app/constants';
import { categoryIcon } from '@/components/categories/categoryIcons';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { CardSkeleton } from '@/components/common/Skeleton';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { pyqsApi } from '../pyqs.api';

export default function PYQsHomePage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['pyqs', 'home'], queryFn: pyqsApi.home });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'PYQs' }]} />
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 p-6 text-white sm:p-8">
        <NotebookTabs className="h-8 w-8 text-accent-100" />
        <h1 className="mt-3 text-3xl font-bold text-white">Previous Year Questions</h1>
        <p className="mt-1 max-w-2xl text-accent-50">Solve actual exam papers subject-wise and year-wise in a real exam interface, then review the answer key with explanations.</p>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <CardSkeleton count={2} />
        </div>
      ) : !data?.length ? (
        <EmptyState title="No PYQs yet" message="Previous year papers will appear here once they are published." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.map((exam) => {
            const Icon = categoryIcon(exam.icon, exam.slug);
            return (
              <section key={exam._id} className="card overflow-hidden">
                <Link to={pyqExamUrl(exam.slug)} className="group flex items-center gap-4 border-b border-slate-100 p-5 hover:bg-slate-50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold group-hover:text-brand-700">{exam.name} PYQs</h2>
                    <p className="text-sm text-slate-500">
                      {exam.children.length} subjects • {exam.paperCount} papers
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-600" />
                </Link>
                <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
                  {exam.children.map((subject) => {
                    const SubIcon = categoryIcon(subject.icon, subject.slug);
                    return (
                      <Link key={subject._id} to={pyqSubjectUrl(exam.slug, subject.slug)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:border-brand-300 hover:bg-brand-50">
                        <SubIcon className="h-4 w-4 text-brand-600" />
                        <span className="flex-1 truncate">{subject.name}</span>
                        <span className="text-xs text-slate-400">{subject.paperCount}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
