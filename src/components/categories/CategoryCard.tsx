import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { categoryIcon } from './categoryIcons';

interface CategoryCardProps {
  to: string;
  name: string;
  slug: string;
  icon?: string;
  subtitle?: string;
  children?: { name: string }[];
  compact?: boolean;
}

export function CategoryCard({ to, name, slug, icon, subtitle, children, compact }: CategoryCardProps) {
  const Icon = categoryIcon(icon, slug);
  return (
    <Link
      to={to}
      className={cn(
        'group card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <div className={cn('flex shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white', compact ? 'h-10 w-10' : 'h-12 w-12')}>
        <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-slate-900">{name}</h3>
        {subtitle ? (
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        ) : children && children.length > 0 ? (
          <p className="truncate text-xs text-slate-500">{children.map((c) => c.name).join(' • ')}</p>
        ) : null}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-600" aria-hidden />
    </Link>
  );
}
