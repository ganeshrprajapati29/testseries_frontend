import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoryUrl, pyqCategoryUrl } from '@/app/constants';
import { categoryIcon } from '@/components/categories/categoryIcons';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { CardSkeleton } from '@/components/common/Skeleton';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import type { CategoryNode } from '@/types';
import { useCategoryTree } from '../categories.api';

function ExamBlock({ node, linkFor }: { node: CategoryNode; linkFor: (n: CategoryNode) => string }) {
  const Icon = categoryIcon(node.icon, node.slug);
  return (
    <div className="card p-5">
      <Link to={linkFor(node)} className="group flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="flex-1 text-lg font-bold group-hover:text-brand-700">{node.name}</h2>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600" />
      </Link>
      {node.children.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {node.children.map((child) => (
            <li key={child._id}>
              <Link to={linkFor(child)} className="font-medium text-slate-800 hover:text-brand-700">
                {child.name}
              </Link>
              {child.children.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {child.children.map((g) => (
                    <Link key={g._id} to={linkFor(g)} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700">
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const tests = useCategoryTree('TEST_SERIES');
  const pyqs = useCategoryTree('PYQS');

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'All exams' }]} />
      <h1 className="text-3xl font-bold">All exams</h1>
      <p className="mt-1 text-slate-500">Browse test series and previous year papers by exam and subject.</p>

      <h2 className="mt-10 mb-4 text-xl font-bold">Test Series</h2>
      {tests.error ? (
        <ErrorState error={tests.error} onRetry={() => tests.refetch()} />
      ) : tests.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton count={6} />
        </div>
      ) : tests.data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tests.data.map((n) => (
            <ExamBlock key={n._id} node={n} linkFor={(c) => categoryUrl(c.path)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No exams yet" message="Exam categories will appear here once they are published." />
      )}

      <h2 className="mt-12 mb-4 text-xl font-bold">Previous Year Questions</h2>
      {pyqs.error ? (
        <ErrorState error={pyqs.error} onRetry={() => pyqs.refetch()} />
      ) : pyqs.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <CardSkeleton count={2} />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pyqs.data?.map((n) => (
            <ExamBlock key={n._id} node={n} linkFor={(c) => pyqCategoryUrl(c.path || c.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}
