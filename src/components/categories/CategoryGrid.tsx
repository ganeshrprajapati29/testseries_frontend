import { categoryUrl } from '@/app/constants';
import type { CategoryNode } from '@/types';
import { CardSkeleton } from '../common/Skeleton';
import { CategoryCard } from './CategoryCard';

export function CategoryGrid({ categories, isLoading, linkFor = (c) => categoryUrl(c.path) }: { categories?: CategoryNode[]; isLoading?: boolean; linkFor?: (c: CategoryNode) => string }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton count={6} />
      </div>
    );
  }
  if (!categories?.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((c) => (
        <CategoryCard key={c._id} to={linkFor(c)} name={c.name} slug={c.slug} icon={c.icon} imageUrl={c.imageUrl} children={c.children} subtitle={c.children.length ? undefined : c.description || undefined} />
      ))}
    </div>
  );
}
