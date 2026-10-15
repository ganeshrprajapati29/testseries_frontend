import { Clock, FileQuestion, PlayCircle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pyqPaperUrl } from '@/app/constants';
import { buttonClasses } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDuration, formatScore } from '@/lib/formatters';
import type { PyqCategoryData } from '../pyqs.types';

export function PaperList({ data, showSubject }: { data: PyqCategoryData; showSubject?: boolean }) {
  if (!data.paperCount) return <EmptyState title="No papers published yet" message="Previous year papers for this section will be added soon." />;
  return (
    <div className="space-y-8">
      {data.papersByYear.map((group) => (
        <section key={group.year ?? 'other'}>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <span className="rounded-lg bg-accent-500 px-2.5 py-0.5 text-sm text-white">{group.year ?? 'Other'}</span>
            <span className="text-sm font-normal text-slate-500">{group.papers.length} paper(s)</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {group.papers.map((p) => (
              <div key={p._id} className="card flex flex-col gap-3 p-4">
                <div>
                  <Link to={pyqPaperUrl(p.slug)} className="font-semibold hover:text-brand-700">
                    {p.title}
                  </Link>
                  {showSubject && p.subject && <p className="text-xs text-slate-500">{p.subject.name}</p>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
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
                <Link to={pyqPaperUrl(p.slug)} className={buttonClasses('secondary', 'sm', 'self-start')}>
                  <PlayCircle className="h-4 w-4" /> Attempt paper
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
