import type { AccessType, AttemptStatus, CategoryNode, Language, ModuleType, PublicationStatus, Question, ResultVisibility, TestType } from '@/types';

export interface AdminDashboardData {
  counts: {
    students: number;
    newStudents30d: number;
    categories: number;
    series: number;
    publishedSeries: number;
    tests: number;
    publishedTests: number;
    pyqPapers: number;
    questions: number;
    attempts: number;
    activeAttempts: number;
    enrollments: number;
    results30d: number;
    averagePercentage30d: number;
    paidOrders: number;
    revenueInPaise: number;
  };
  attemptsByDay: { date: string; attempts: number }[];
  topTests: { testId: string; title: string; attempts: number; averagePercentage: number }[];
  recentResults: AdminResult[];
}

export interface AdminSeries {
  _id: string;
  title: string;
  slug: string;
  description: string;
  highlights: string[];
  moduleType: ModuleType;
  categoryId: { _id: string; name: string; slug: string; moduleType?: ModuleType } | string;
  examName: string;
  subject: string;
  coverImage: string;
  languageOptions: Language[];
  accessType: AccessType;
  price: number;
  mrp: number;
  validityDays: number;
  availableFrom: string | null;
  availableUntil: string | null;
  isFeatured: boolean;
  sortOrder: number;
  publicationStatus: PublicationStatus;
  testCount?: number;
  enrollmentCount?: number;
  updatedAt: string;
  tests?: AdminTest[];
}

export interface AdminTest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  moduleType: ModuleType;
  seriesId: { _id: string; title: string; slug: string; accessType?: AccessType } | string | null;
  categoryId: { _id: string; name: string; slug: string } | string;
  series?: { _id: string; title: string; slug: string };
  category?: { _id: string; name: string; slug: string };
  testType: TestType;
  paperYear: number | null;
  paperName: string;
  questionIds?: Question[];
  questionCount?: number;
  languageOptions: Language[];
  durationSeconds: number;
  durationMinutes?: number;
  marksPerCorrect: number;
  negativeMarks: number;
  totalMarks: number;
  maxAttempts: number;
  isFree: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  resultVisibility: ResultVisibility;
  sortOrder: number;
  publicationStatus: PublicationStatus;
  attemptCount?: number;
  updatedAt: string;
}

export interface AdminStudent {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  accountStatus: string;
  lastLoginAt: string | null;
  createdAt: string;
  attemptCount?: number;
}

export interface AdminResult {
  _id: string;
  attemptId: string;
  studentId: { _id: string; name: string; email: string } | null;
  testId: string;
  testTitle: string;
  totalScore: number;
  maximumMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  evaluatedAt: string;
}

export interface AdminAttempt {
  _id: string;
  studentId: { _id: string; name: string; email: string } | null;
  testId: string;
  status: AttemptStatus;
  attemptNumber: number;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  finalScore: number | null;
  testConfigurationSnapshot?: { title: string };
  scoringConfigurationSnapshot?: { maximumMarks: number };
}

export interface ImportJob {
  _id: string;
  fileName: string;
  fileType: 'csv' | 'xlsx';
  status: 'validated' | 'committed' | 'failed' | 'cancelled';
  targetTestId: { _id: string; title: string } | string | null;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedCount: number;
  rowErrors?: { row: number; field: string; message: string }[];
  preview?: { row: number; questionText: string; options: { key: string; text: string }[]; correctOption: string; subject: string; duplicate: boolean }[];
  createdBy?: { name: string; email: string };
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

export interface AdminOrder {
  _id: string;
  studentId: { name: string; email: string } | null;
  testSeriesId: { title: string } | null;
  amount: number;
  orderStatus: string;
  providerOrderId: string;
  createdAt: string;
}

export type AdminCategory = CategoryNode;
