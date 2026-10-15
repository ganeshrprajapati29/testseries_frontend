import { categoryUrl, ROUTES } from '@/app/constants';
import type { Breadcrumb } from '@/types';
import { Breadcrumbs, type Crumb } from '../layout/Breadcrumbs';

/** Breadcrumb for Test Series category chains: Test Series / Defence / CDS / ... */
export function CategoryBreadcrumb({ chain, current, rootLabel = 'Test Series', rootTo = ROUTES.testSeries, linkFor = categoryUrl }: { chain: Breadcrumb[]; current?: string; rootLabel?: string; rootTo?: string; linkFor?: (path: string) => string }) {
  const items: Crumb[] = [{ label: rootLabel, to: rootTo }, ...chain.map((c) => ({ label: c.name, to: linkFor(c.path) }))];
  if (current) items.push({ label: current });
  return <Breadcrumbs items={items} />;
}
