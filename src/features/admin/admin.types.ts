import type { AccessType, AttemptStatus, CategoryNode, Language, ModuleType, PdfRef, PublicationStatus, Question, ReportReason, ReportStatus, ResultVisibility, TestType } from '@/types';

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
  hi?: { title: string; description: string; highlights: string[] };
  /** Full category path, e.g. "Defence › CDS". */
  categoryLabel?: string;
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
  questionPaperPdf?: PdfRef | null;
  solutionPdf?: PdfRef | null;
  sortOrder: number;
  publicationStatus: PublicationStatus;
  attemptCount?: number;
  updatedAt: string;
  hi?: { title: string; description: string; instructions: string };
  /** Set for automatic practice sets (questions come from the Question Bank category). */
  autoCategoryId?: string | null;
  autoPart?: number | null;
  /** Full category path, e.g. "Defence › CDS › Maths". */
  categoryLabel?: string;
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
  enrollmentCount?: number;
  preferredLanguage?: 'en' | 'hi';
  emailVerifiedAt?: string | null;
}

export interface StudentFormInput {
  name: string;
  email: string;
  mobile: string;
  accountStatus: 'active' | 'suspended' | 'deactivated';
  preferredLanguage: 'en' | 'hi';
}

export interface StudentStats {
  total: number;
  active: number;
  suspended: number;
  deactivated: number;
  newThisWeek: number;
  activeThisWeek: number;
  withoutMobile: number;
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
  preview?: { row: number; questionText: string; options: { key: string; text: string }[]; correctOption: string; subject: string; duplicate: boolean; categories?: string[] }[];
  /** Where the valid rows will appear on the website. */
  destinations?: { categoryId: string; label: string; moduleType: string; count: number }[];
  /** Valid rows without a category (only reach the website through a test). */
  uncategorizedRows?: number;
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

/** Reported question row: one question with how many students reported it. */
export interface ReportGroup {
  questionId: string;
  count: number;
  reasonCounts: Partial<Record<ReportReason, number>>;
  statuses: ReportStatus[];
  latestAt: string;
  tests: { _id: string; title: string; moduleType: ModuleType }[];
  question: Question | null;
}

export interface AdminQuestionReport {
  _id: string;
  questionId: string;
  studentId: { _id: string; name: string; email: string; mobile?: string } | null;
  testId: { _id: string; title: string; moduleType: ModuleType } | null;
  attemptId: string;
  questionNumber: number | null;
  reason: ReportReason;
  comment: string;
  language: 'en' | 'hi';
  status: ReportStatus;
  adminNote: string;
  resolvedBy: { _id: string; name: string } | null;
  resolvedAt: string | null;
  createdAt: string;
}

export type AdminRole = 'admin' | 'superadmin';

export interface AdminAccount {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  accountStatus: 'active' | 'suspended' | 'deactivated';
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
}

/** Where students find a question on the website. */
export interface QuestionWebsiteLink {
  testId: string;
  title: string;
  isPracticeSet: boolean;
  /** Paper / test page on the student website */
  url: string;
  questionNumber: number;
  totalQuestions: number;
  /** Category page that lists the paper */
  categoryUrl: string | null;
}

/** A test / paper / practice set that contains a question. */
export interface QuestionUsage {
  _id: string;
  title: string;
  slug: string;
  publicationStatus: PublicationStatus;
  moduleType: ModuleType;
  autoCategoryId?: string | null;
  seriesId?: string | null;
}
