import type { Breadcrumb, CategoryNode, ModuleType } from '@/types';

export interface ResolvedCategory {
  category: { _id: string; name: string; slug: string; description: string; moduleType: ModuleType; path: string; depth: number };
  breadcrumb: Breadcrumb[];
  children: { _id: string; name: string; slug: string; description: string; path: string; paperCount?: number }[];
}

export type { CategoryNode };
