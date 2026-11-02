import { api } from '@/services/apiClient';
import type { TestDetail } from '@/types';
import type { PyqCategoryData, PyqExamNode } from './pyqs.types';

export const pyqsApi = {
  home: () => api.get<PyqExamNode[]>('/pyqs'),
  category: (path: string, params: { year?: number; page?: number; limit?: number } = {}) =>
    api.get<PyqCategoryData>(`/pyqs/category/${path.split('/').map(encodeURIComponent).join('/')}`, params),
  paper: (slug: string) => api.get<TestDetail>(`/pyqs/papers/${slug}`),
};
