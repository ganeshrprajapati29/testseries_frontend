import { api } from '@/services/apiClient';
import type { CategoryNode, ModuleType, Question, SolutionsData } from '@/types';
import type {
  AdminAttempt,
  AdminDashboardData,
  AdminOrder,
  AdminResult,
  AdminSeries,
  AdminStudent,
  AdminTest,
  AuditLog,
  ImportJob,
} from './admin.types';

type Params = Record<string, string | number | boolean | undefined | null>;

export const adminApi = {
  dashboard: () => api.get<AdminDashboardData>('/admin/dashboard'),

  // Categories
  categories: (moduleType?: ModuleType, includeArchived = false) => api.get<CategoryNode[]>('/admin/categories', { moduleType, includeArchived: includeArchived ? 'true' : undefined }),
  createCategory: (body: unknown) => api.post<CategoryNode>('/admin/categories', body),
  updateCategory: (id: string, body: unknown) => api.patch<CategoryNode>(`/admin/categories/${id}`, body),
  reorderCategories: (items: { id: string; sortOrder: number }[]) => api.put('/admin/categories/reorder', { items }),
  categoryAction: (id: string, action: 'activate' | 'deactivate' | 'archive' | 'restore') => api.post(`/admin/categories/${id}/${action}`),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),

  // Test series
  seriesList: (params: Params) => api.page<AdminSeries>('/admin/test-series', params),
  series: (id: string) => api.get<AdminSeries>(`/admin/test-series/${id}`),
  createSeries: (body: unknown) => api.post<AdminSeries>('/admin/test-series', body),
  updateSeries: (id: string, body: unknown) => api.patch<AdminSeries>(`/admin/test-series/${id}`, body),
  seriesPublication: (id: string, publicationStatus: string) => api.post<AdminSeries>(`/admin/test-series/${id}/publication`, { publicationStatus }),
  duplicateSeries: (id: string) => api.post<AdminSeries>(`/admin/test-series/${id}/duplicate`),
  deleteSeries: (id: string) => api.delete<{ archived: boolean }>(`/admin/test-series/${id}`),

  // Tests
  tests: (params: Params) => api.page<AdminTest>('/admin/tests', params),
  test: (id: string) => api.get<AdminTest>(`/admin/tests/${id}`),
  previewTest: (id: string) => api.get<AdminTest & { questions: Question[] }>(`/admin/tests/${id}/preview`),
  createTest: (body: unknown) => api.post<AdminTest>('/admin/tests', body),
  updateTest: (id: string, body: unknown) => api.patch<AdminTest>(`/admin/tests/${id}`, body),
  setTestQuestions: (id: string, questionIds: string[]) => api.put<{ questionCount: number; totalMarks: number }>(`/admin/tests/${id}/questions`, { questionIds }),
  addTestQuestions: (id: string, questionIds: string[]) => api.post<{ added: number; total: number }>(`/admin/tests/${id}/questions`, { questionIds }),
  removeTestQuestion: (id: string, questionId: string) => api.delete(`/admin/tests/${id}/questions/${questionId}`),
  testPublication: (id: string, publicationStatus: string) => api.post<AdminTest>(`/admin/tests/${id}/publication`, { publicationStatus }),
  duplicateTest: (id: string) => api.post<AdminTest>(`/admin/tests/${id}/duplicate`),
  deleteTest: (id: string) => api.delete<{ archived: boolean }>(`/admin/tests/${id}`),

  // Questions
  questions: (params: Params) => api.page<Question>('/admin/questions', params),
  questionFacets: () => api.get<{ subjects: string[]; sourceExams: string[]; years: number[] }>('/admin/questions/facets'),
  question: (id: string) => api.get<Question & { tests: { _id: string; title: string; publicationStatus: string }[] }>(`/admin/questions/${id}`),
  createQuestion: (body: unknown) => api.post<Question>('/admin/questions', body),
  updateQuestion: (id: string, body: unknown) => api.patch<Question>(`/admin/questions/${id}`, body),
  archiveQuestion: (id: string) => api.post<Question>(`/admin/questions/${id}/archive`),
  restoreQuestion: (id: string) => api.post<Question>(`/admin/questions/${id}/restore`),
  deleteQuestion: (id: string) => api.delete(`/admin/questions/${id}`),
  uploadImage: (file: File, folder: 'questions' | 'covers' = 'questions') => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<{ url: string; key: string }>(`/admin/questions/upload-image?folder=${folder}`, form);
  },

  // Imports
  imports: (params: Params) => api.page<ImportJob>('/admin/imports', params),
  importJob: (id: string) => api.get<ImportJob>(`/admin/imports/${id}`),
  uploadImport: (form: FormData) => api.upload<ImportJob>('/admin/imports', form),
  commitImport: (id: string, skipDuplicates: boolean) => api.post<{ importedCount: number; skipped: number }>(`/admin/imports/${id}/commit`, { skipDuplicates }),
  cancelImport: (id: string) => api.post(`/admin/imports/${id}/cancel`),
  downloadTemplate: () => api.download('/admin/imports/template', 'civil-sansad-question-template.csv'),

  // Students
  students: (params: Params) => api.page<AdminStudent>('/admin/students', params),
  student: (id: string) =>
    api.get<{
      student: AdminStudent;
      enrollments: { _id: string; source: string; expiresAt: string | null; revokedAt: string | null; testSeriesId: { _id: string; title: string } | null }[];
      results: AdminResult[];
      attemptCount: number;
    }>(`/admin/students/${id}`),
  setStudentStatus: (id: string, accountStatus: string) => api.patch(`/admin/students/${id}/status`, { accountStatus }),
  grantAccess: (id: string, testSeriesId: string, validityDays?: number) => api.post(`/admin/students/${id}/access`, { testSeriesId, validityDays }),
  revokeAccess: (id: string, seriesId: string) => api.delete(`/admin/students/${id}/access/${seriesId}`),

  // Attempts & results
  attempts: (params: Params) => api.page<AdminAttempt>('/admin/attempts', params),
  attempt: (id: string) => api.get<{ attempt: AdminAttempt; result: AdminResult | null; solutions: SolutionsData | null }>(`/admin/attempts/${id}`),
  results: (params: Params) => api.page<AdminResult>('/admin/results', params),
  exportResults: (params: Params) => api.download('/admin/results/export', `results-${new Date().toISOString().slice(0, 10)}.csv`, params),

  // Settings, audit & orders
  settings: () => api.get<{ values: Record<string, unknown>; descriptors: { key: string; description: string; isPublic: boolean; type: string }[] }>('/admin/settings'),
  updateSettings: (values: Record<string, unknown>) => api.put<Record<string, unknown>>('/admin/settings', values),
  auditLogs: (params: Params) => api.page<AuditLog>('/admin/audit-logs', params),
  orders: (params: Params) => api.page<AdminOrder>('/admin/orders', params),
  paymentConfig: () => api.get<{ enabled: boolean; keyId: string | null }>('/payments/config'),
};
