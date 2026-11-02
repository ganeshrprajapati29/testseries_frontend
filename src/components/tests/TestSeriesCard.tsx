import { CheckCircle2, FileText, Languages, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { seriesUrl } from '@/app/constants';
import { formatCurrency, pluralize } from '@/lib/formatters';
import type { SeriesSummary } from '@/types';
import { Badge } from '../common/Badge';
import { buttonClasses } from '../common/Button';

export function TestSeriesCard({ series }: { series: SeriesSummary }) {
  const discount = series.accessType === 'paid' && series.mrp > series.price ? Math.round(((series.mrp - series.price) / series.mrp) * 100) : 0;
  return (
    <article className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative h-32 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900">
        {series.coverImage ? (
          <img src={series.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col justify-end p-4">
            <p className="text-xs font-semibold tracking-wider text-brand-100 uppercase">{series.categoryId?.name ?? series.examName}</p>
            <p className="line-clamp-2 text-lg leading-tight font-bold text-white">{series.examName || series.title}</p>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {series.isFeatured && (
            <Badge tone="orange" className="bg-accent-500 text-white ring-0">
              <Sparkles className="h-3 w-3" /> Featured
            </Badge>
          )}
          {series.accessType === 'free' ? <Badge tone="green">Free</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900">
          <Link to={seriesUrl(series.slug)} className="after:absolute after:inset-0 hover:text-brand-700">
            {series.title}
          </Link>
        </h3>
        {series.hi?.title && (
          <p lang="hi" className="mt-0.5 line-clamp-1 text-sm text-slate-500">
            {series.hi.title}
          </p>
        )}
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-500" /> {pluralize(series.testCount, 'test')}
            {series.freeTestCount > 0 && series.accessType === 'paid' && <span className="text-emerald-600">({series.freeTestCount} free)</span>}
          </li>
          <li className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-brand-500" /> {series.languageOptions.map((l) => (l === 'hi' ? 'Hindi' : 'English')).join(', ')}
          </li>
        </ul>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          {series.accessType === 'paid' ? (
            <div>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(series.price)}</span>
              {discount > 0 && (
                <>
                  <span className="ml-2 text-sm text-slate-400 line-through">{formatCurrency(series.mrp)}</span>
                  <span className="ml-1 text-xs font-semibold text-emerald-600">{discount}% off</span>
                </>
              )}
            </div>
          ) : (
            <span className="text-lg font-bold text-emerald-600">Free</span>
          )}
          {series.isEnrolled ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Enrolled
            </span>
          ) : (
            <span className={buttonClasses('secondary', 'sm', 'relative z-10')}>View tests</span>
          )}
        </div>
      </div>
    </article>
  );
}
