import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck, Clock, FileQuestion, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { testUrl } from '@/app/constants';
import { Badge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { formatDuration, formatScore } from '@/lib/formatters';
import { testSeriesApi } from '../testSeries.api';

/**
 * Practice sets and stand-alone tests placed directly in a category (no series). Questions the admin
 * files under a category in the Question Bank show up here automatically.
 */
export function CategoryTests({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: ['category-tests', categoryId, page],
    queryFn: () => testSeriesApi.categoryTests(categoryId, page),
    placeholderData: (prev) => prev,
  });
  if (!data?.items.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Practice sets & tests</h2>
          <p className="text-sm text-slate-500">Free practice for {categoryName} - new questions are added regularly.</p>
        </div>
        <span className="text-sm text-slate-500">{data.meta.total} available</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.items.map((t) => (
          <Link key={t._id} to={testUrl(t.slug)} className="card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-pop">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {t.isPracticeSet ? (
                <Badge tone="purple">
                  <Sparkles className="h-3 w-3" /> Practice set
                </Badge>
              ) : (
                <Badge tone="blue">
                  <BookOpenCheck className="h-3 w-3" /> Test
                </Badge>
              )}
              {t.isFree && <Badge tone="green">Free</Badge>}
              {t.languageOptions.includes('hi') && <Badge tone="gray">English + हिंदी</Badge>}
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{t.title}</h3>
            {t.hi?.title && (
              <p lang="hi" className="text-sm text-slate-500">
                {t.hi.title}
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <FileQuestion className="h-3.5 w-3.5" /> {t.questionCount} questions
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(t.durationSeconds)}
              </span>
              <span>{formatScore(t.totalMarks)} marks</span>
            </div>
          </Link>
        ))}
      </div>
      <Pagination meta={data.meta} onPageChange={setPage} className="mt-4" />
    </section>
  );
}
