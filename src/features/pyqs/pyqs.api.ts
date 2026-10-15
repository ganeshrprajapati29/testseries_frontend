import { api } from '@/services/apiClient';
import type { TestDetail } from '@/types';
import type { PyqCategoryData, PyqExamNode } from './pyqs.types';

export const pyqsApi = {
  home: () => api.get<PyqExamNode[]>('/pyqs'),
  category: (path: string) => api.get<PyqCategoryData>(`/pyqs/category/${path.split('/').map(encodeURIComponent).join('/')}`),
  paper: (slug: string) => api.get<TestDetail>(`/pyqs/papers/${slug}`),
};
