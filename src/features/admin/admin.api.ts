import { API_BASE_URL } from '@/lib/axios';
import { api } from '@/services/apiClient';
import type { CategoryNode, ModuleType, PdfRef, PrintablePaper, Question, QuestionCategory, ReportStatus, SolutionsData } from '@/types';
import type {
  AdminAttempt,
  AdminDashboardData,
  AdminOrder,
  AdminResult,
  AdminSeries,
  AdminAccount,
  AdminQuestionReport,
  AdminRole,
  QuestionUsage,
  QuestionWebsiteLink,
  AdminStudent,
  ReportGroup,
  StudentFormInput,
  StudentStats,
  AdminTest,
  AuditLog,
  ImportJob,
} from './admin.types';

type Params = Record<string, string | number | boolean | undefined | null>;
export type ImageFolder = 'questions' | 'covers' | 'categories' | 'misc';

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
  questionFacets: () => api.get<{ total: number; uncategorized: number; subjects: string[]; sourceExams: string[]; years: number[] }>('/admin/questions/facets'),
  bulkQuestionCategories: (questionIds: string[], categoryIds: string[], mode: 'add' | 'replace' | 'remove') =>
    api.post<{ updated: number }>('/admin/questions/bulk-categories', { questionIds, categoryIds, mode }),
  question: (id: string) =>
    api.get<Omit<Question, 'categories'> & { tests: QuestionUsage[]; websiteLinks: QuestionWebsiteLink[]; categories: (QuestionCategory & { siteUrl: string | null })[] }>(`/admin/questions/${id}`),
  createQuestion: (body: unknown) => api.post<Question>('/admin/questions', body),
  updateQuestion: (id: string, body: unknown) => api.patch<Question>(`/admin/questions/${id}`, body),
  archiveQuestion: (id: string) => api.post<Question>(`/admin/questions/${id}/archive`),
  restoreQuestion: (id: string) => api.post<Question>(`/admin/questions/${id}/restore`),
  deleteQuestion: (id: string) => api.delete(`/admin/questions/${id}`),
  uploadImages: (files: File[], folder: ImageFolder = 'questions') => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.upload<{ files: { url: string; key: string }[] }>(`/admin/uploads/images?folder=${folder}`, form);
  },
  importImageFromUrl: (url: string, folder: ImageFolder = 'questions') => api.post<{ files: { url: string; key: string }[] }>('/admin/uploads/images/from-url', { url, folder }),
  uploadPdf: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<PdfRef>('/admin/uploads/pdf', form);
  },
  importPdfFromUrl: (url: string) => api.post<PdfRef>('/admin/uploads/pdf/from-url', { url }),
  testPaper: (id: string) => api.get<PrintablePaper>(`/admin/tests/${id}/paper`),
  testPdfUrl: (id: string, kind: 'question-paper' | 'solutions') => `${API_BASE_URL}/admin/tests/${id}/pdf/${kind}`,

  // Imports
  imports: (params: Params) => api.page<ImportJob>('/admin/imports', params),
  importJob: (id: string) => api.get<ImportJob>(`/admin/imports/${id}`),
  uploadImport: (form: FormData) => api.upload<ImportJob>('/admin/imports', form),
  commitImport: (id: string, skipDuplicates: boolean, autoTranslate = false) =>
    api.postWithMessage<{ importedCount: number; skipped: number; linkedExisting?: number; translating?: boolean }>(`/admin/imports/${id}/commit`, { skipDuplicates, autoTranslate }),
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
  studentStats: () => api.get<StudentStats>('/admin/students/stats'),
  createStudent: (body: StudentFormInput & { password: string }) => api.post<AdminStudent>('/admin/students', body),
  updateStudent: (id: string, body: Partial<StudentFormInput>) => api.patch<AdminStudent>(`/admin/students/${id}`, body),
  resetStudentPassword: (id: string, password: string) => api.post(`/admin/students/${id}/reset-password`, { password }),
  deleteStudent: (id: string) => api.delete<{ removed: { attempts: number; results: number; enrollments: number } }>(`/admin/students/${id}`),
  exportStudents: (params: Params) => api.download('/admin/students/export', `students-${new Date().toISOString().slice(0, 10)}.csv`, params),
  setStudentStatus: (id: string, accountStatus: string) => api.patch(`/admin/students/${id}/status`, { accountStatus }),
  grantAccess: (id: string, testSeriesId: string, validityDays?: number) => api.post(`/admin/students/${id}/access`, { testSeriesId, validityDays }),
  revokeAccess: (id: string, seriesId: string) => api.delete(`/admin/students/${id}/access/${seriesId}`),

  // Admin accounts (super admin)
  admins: () => api.get<AdminAccount[]>('/admin/admins'),
  createAdmin: (body: { name: string; email: string; password: string; role: AdminRole }) => api.post<AdminAccount>('/admin/admins', body),
  updateAdmin: (id: string, body: Partial<{ name: string; email: string; role: AdminRole; accountStatus: string }>) => api.patch<AdminAccount>(`/admin/admins/${id}`, body),
  resetAdminPassword: (id: string, password: string) => api.post(`/admin/admins/${id}/reset-password`, { password }),

  // Reported questions
  questionReportCounts: () => api.get<{ open: number; resolved: number; dismissed: number; openQuestions: number }>('/admin/question-reports/counts'),
  questionReports: (params: Params) => api.page<ReportGroup>('/admin/question-reports', params),
  reportsForQuestion: (questionId: string) => api.get<AdminQuestionReport[]>(`/admin/question-reports/question/${questionId}`),
  updateReport: (id: string, body: { status: ReportStatus; adminNote?: string }) => api.patch<AdminQuestionReport>(`/admin/question-reports/${id}`, body),
  closeQuestionReports: (questionId: string, body: { status: 'resolved' | 'dismissed'; adminNote: string }) =>
    api.postWithMessage<{ updated: number }>(`/admin/question-reports/question/${questionId}/close`, body),

  // Machine translation (English -> Hindi)
  translateStatus: () => api.get<{ enabled: boolean; provider: string }>('/admin/translate/status'),
  translate: async (texts: string[]) => (await api.post<{ translations: string[] }>('/admin/translate', { texts })).translations,
  bulkTranslateQuestions: (questionIds: string[], overwrite = false) =>
    api.postWithMessage<{ translated: number; skipped: number; failed: number }>('/admin/questions/bulk-translate', { questionIds, overwrite }),

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
