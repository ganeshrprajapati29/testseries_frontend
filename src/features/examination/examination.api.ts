import { api } from '@/services/apiClient';
import type { ExamPayload, Language, MyQuestionReport, ReportReason, ResultData, SolutionsData } from '@/types';
import type { PendingAnswer } from './examination.types';

export const examinationApi = {
  start: (testId: string, language?: Language) => api.post<{ attemptId: string; resumed: boolean }>(`/exams/tests/${testId}/start`, { language }),
  attempt: (attemptId: string) => api.get<ExamPayload>(`/exams/attempts/${attemptId}`),
  saveAnswers: (attemptId: string, answers: PendingAnswer[]) => api.put<{ saved: number; serverNow: string }>(`/exams/attempts/${attemptId}/answers`, { answers }),
  setLanguage: (attemptId: string, language: Language) => api.patch(`/exams/attempts/${attemptId}/language`, { language }),
  submit: (attemptId: string) => api.post<{ attemptId: string; alreadySubmitted: boolean }>(`/exams/attempts/${attemptId}/submit`),
  myReports: (attemptId: string) => api.get<MyQuestionReport[]>(`/exams/attempts/${attemptId}/reports`),
  reportQuestion: (attemptId: string, body: { questionId: string; reason: ReportReason; comment: string }) => api.postWithMessage<MyQuestionReport>(`/exams/attempts/${attemptId}/reports`, body),
  result: (attemptId: string) => api.get<ResultData>(`/results/${attemptId}`),
  solutions: (attemptId: string) => api.get<SolutionsData>(`/results/${attemptId}/solutions`),
};
