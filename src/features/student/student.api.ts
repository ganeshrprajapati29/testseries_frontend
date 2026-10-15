import { api } from '@/services/apiClient';
import type { AttemptHistoryItem, Enrollment } from '@/types';

export interface DashboardData {
  stats: {
    testsTaken: number;
    averagePercentage: number;
    averageAccuracy: number;
    bestPercentage: number;
    questionsAttempted: number;
    correctAnswers: number;
    timeSpentSeconds: number;
  };
  recentResults: { _id: string; attemptId: string; testTitle: string; totalScore: number; maximumMarks: number; percentage: number; accuracy: number; evaluatedAt: string }[];
  inProgress: { id: string; title: string; deadlineAt: string; startedAt: string }[];
  enrollments: Enrollment[];
}

export const studentApi = {
  dashboard: () => api.get<DashboardData>('/student/dashboard'),
  myTests: () => api.get<Enrollment[]>('/student/my-tests'),
  attempts: (params: { page?: number; limit?: number; status?: string }) => api.page<AttemptHistoryItem>('/student/attempts', params),
  orders: () =>
    api.get<{ _id: string; amount: number; orderStatus: string; createdAt: string; testSeriesId: { title: string; slug: string } | null }[]>('/student/orders'),
};
