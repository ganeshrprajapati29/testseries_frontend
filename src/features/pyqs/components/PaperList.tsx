import { Clock, FileDown, FileQuestion, PlayCircle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pyqPaperUrl } from '@/app/constants';
import { Badge } from '@/components/common/Badge';
import { buttonClasses } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { formatDuration, formatScore } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { PyqCategoryData } from '../pyqs.types';

interface PaperListProps {
  data: PyqCategoryData;
  year: number | null;
  onYear: (year: number | null) => void;
  onPage: (page: number) => void;
  showSubject?: boolean;
  loading?: boolean;
}

/** Year filter chips + paginated grid of papers (Testbook-style). */
export function PaperList({ data, year, onYear, onPage, showSubject, loading }: PaperListProps) {
  if (!data.paperCount) return <EmptyState title="No papers published yet" message="Previous year papers for this section will be added soon." />;

  const chip = (active: boolean) =>
    cn('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition', active ? 'bg-accent-500 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-accent-300');

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by year">
        <button type="button" role="tab" aria-selected={year === null} onClick={() => onYear(null)} className={chip(year === null)}>
          All years <span className="opacity-75">({data.paperCount})</span>
        </button>
        {data.years.map((y) => (
          <button key={y.year} type="button" role="tab" aria-selected={year === y.year} onClick={() => onYear(y.year)} className={chip(year === y.year)}>
            {y.year} <span className="opacity-75">({y.count})</span>
          </button>
        ))}
      </div>

      <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
        {data.papers.map((p) => (
          <article key={p._id} className="card flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {p.paperYear && <Badge tone="orange">{p.paperYear}</Badge>}
                {showSubject && p.subject && <Badge tone="blue">{p.subject.name}</Badge>}
                {p.hasQuestionPaperPdf && (
                  <Badge tone="red">
                    <FileDown className="h-3 w-3" /> PDF
                  </Badge>
                )}
              </div>
              <Badge tone="green">Free</Badge>
            </div>
            <Link to={pyqPaperUrl(p.slug)} className="mt-3 font-semibold text-slate-900 hover:text-brand-700">
              {p.title}
            </Link>
            {p.hi?.title && (
              <p lang="hi" className="text-sm text-slate-500">
                {p.hi.title}
              </p>
            )}
            {p.paperName && <p className="text-xs text-slate-500">{p.paperName}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <FileQuestion className="h-3.5 w-3.5" /> {p.questionCount} Qs
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" /> {formatScore(p.totalMarks)} marks
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(p.durationSeconds)}
              </span>
            </div>
            <div className="mt-auto pt-4">
              <Link to={pyqPaperUrl(p.slug)} className={buttonClasses('primary', 'sm', 'w-full')}>
                <PlayCircle className="h-4 w-4" /> Attempt paper
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!data.papers.length && <EmptyState title={`No papers for ${year}`} />}
      <Pagination meta={data.meta} onPageChange={onPage} />
    </div>
  );
}
