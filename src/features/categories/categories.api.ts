import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/apiClient';
import type { CategoryNode, ModuleType } from '@/types';
import type { ResolvedCategory } from './categories.types';

export const categoriesApi = {
  tree: (moduleType: ModuleType = 'TEST_SERIES') => api.get<CategoryNode[]>('/categories', { moduleType }),
  resolve: (moduleType: ModuleType, path: string) => api.get<ResolvedCategory>('/categories/resolve', { moduleType, path }),
};

export function useCategoryTree(moduleType: ModuleType = 'TEST_SERIES') {
  return useQuery({ queryKey: ['categories', 'tree', moduleType], queryFn: () => categoriesApi.tree(moduleType), staleTime: 5 * 60_000 });
}

export function useResolvedCategory(moduleType: ModuleType, path: string) {
  return useQuery({ queryKey: ['categories', 'resolve', moduleType, path], queryFn: () => categoriesApi.resolve(moduleType, path), enabled: !!path });
}

/** Flattens a tree into "Parent / Child" labelled options for selects. */
export function flattenTree(nodes: CategoryNode[], prefix = ''): { value: string; label: string; node: CategoryNode }[] {
  return nodes.flatMap((n) => {
    const label = prefix ? `${prefix} / ${n.name}` : n.name;
    return [{ value: n._id, label, node: n }, ...flattenTree(n.children, label)];
  });
}
