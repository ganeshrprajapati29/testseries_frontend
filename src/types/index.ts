export type Role = 'student' | 'admin' | 'superadmin';
export type ModuleType = 'TEST_SERIES' | 'PYQS';
export type PublicationStatus = 'draft' | 'published' | 'unpublished' | 'archived';
export type AccessType = 'free' | 'paid';
export type Language = 'en' | 'hi';
export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type TestType = 'FULL_LENGTH' | 'SECTIONAL' | 'CHAPTER' | 'MINI' | 'PYQ_PAPER';
export type ResultVisibility = 'IMMEDIATE' | 'AFTER_WINDOW' | 'HIDDEN';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EVALUATED';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  accountStatus: string;
  preferredLanguage: Language;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  moduleType: ModuleType;
  parentId: string | null;
  depth: number;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  status: 'active' | 'inactive' | 'archived';
  path: string;
  children: CategoryNode[];
  seriesCount?: number;
  testCount?: number;
  paperCount?: number;
}

export interface Breadcrumb {
  _id: string;
  name: string;
  slug: string;
  path: string;
}

export interface SeriesSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  accessType: AccessType;
  price: number;
  mrp: number;
  examName: string;
  languageOptions: Language[];
  isFeatured: boolean;
  validityDays: number;
  categoryId: { _id: string; name: string; slug: string } | null;
  testCount: number;
  freeTestCount: number;
  isEnrolled?: boolean;
}

export interface MyAttemptsInfo {
  attempts: number;
  inProgressAttemptId: string | null;
  lastAttemptId: string | null;
}

export interface SeriesTest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  testType: TestType;
  durationSeconds: number;
  marksPerCorrect: number;
  negativeMarks: number;
  totalMarks: number;
  maxAttempts: number;
  isFree: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  languageOptions: Language[];
  paperYear: number | null;
  questionCount: number;
  locked: boolean;
  myAttempts: MyAttemptsInfo;
}

export interface SeriesDetail extends Omit<SeriesSummary, 'testCount' | 'freeTestCount'> {
  highlights: string[];
  subject: string;
  breadcrumb: Breadcrumb[];
  hasAccess: boolean;
  isEnrolled: boolean;
  enrollmentExpiresAt: string | null;
  tests: SeriesTest[];
}

export interface TestDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  moduleType: ModuleType;
  testType: TestType;
  paperYear: number | null;
  paperName: string;
  languageOptions: Language[];
  durationSeconds: number;
  durationMinutes: number;
  marksPerCorrect: number;
  negativeMarks: number;
  totalMarks: number;
  maxAttempts: number;
  isFree: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  resultVisibility: ResultVisibility;
  questionCount: number;
  series: { _id: string; title: string; slug: string; accessType: AccessType; price: number } | null;
  breadcrumb: Breadcrumb[];
  availability: 'UPCOMING' | 'OPEN' | 'CLOSED';
  hasAccess: boolean;
  attemptsUsed: number;
  attemptsLeft: number | null;
  inProgressAttemptId: string | null;
  myAttempts: { _id: string; status: AttemptStatus; attemptNumber: number; finalScore: number | null; submittedAt: string | null }[];
}

export interface ExamOption {
  key: OptionKey;
  text: string;
  imageUrl: string;
}

export interface ExamQuestion {
  id: string;
  questionText: string;
  imageUrl: string;
  options: ExamOption[];
  translations: { language: Language; questionText: string; options: { key: OptionKey; text: string }[] }[];
  subject: string;
  topic: string;
}

export interface AnswerState {
  questionId: string;
  selectedOption: OptionKey | null;
  markedForReview: boolean;
  visited: boolean;
  timeSpentSeconds: number;
}

export interface AttemptSummary {
  id: string;
  testId: string;
  status: AttemptStatus;
  attemptNumber: number;
  language: Language;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  title: string;
  durationSeconds: number;
  languageOptions: Language[];
  marksPerCorrect: number;
  negativeMarks: number;
  totalQuestions: number;
  maximumMarks: number;
}

export interface ExamPayload {
  attempt: AttemptSummary;
  finished: boolean;
  serverNow: string;
  remainingSeconds: number;
  questions: ExamQuestion[];
  answers: AnswerState[];
}

export interface SubjectBreakdown {
  subject: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
  accuracy: number;
}

export interface ResultData {
  attemptId: string;
  testId: string;
  testSlug: string | null;
  testTitle: string;
  status: AttemptStatus;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  resultVisible: boolean;
  releaseAt: string | null;
  message: string;
  totalQuestions?: number;
  attemptedCount?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  totalScore?: number;
  maximumMarks?: number;
  percentage?: number;
  accuracy?: number;
  timeTakenSeconds?: number;
  marksPerCorrect?: number;
  negativeMarks?: number;
  rank?: number;
  totalCandidates?: number;
  percentile?: number;
  topperScore?: number;
  averageScore?: number;
  subjectBreakdown?: SubjectBreakdown[];
}

export interface SolutionQuestion extends ExamQuestion {
  number: number;
  explanation: string;
  translations: { language: Language; questionText: string; options: { key: OptionKey; text: string }[]; explanation: string }[];
  difficulty: Difficulty;
  correctOption: OptionKey;
  selectedOption: OptionKey | null;
  isCorrect: boolean;
  isAttempted: boolean;
  marksAwarded: number;
  markedForReview: boolean;
  timeSpentSeconds: number;
}

export interface SolutionsData {
  attemptId: string;
  testTitle: string;
  language: Language;
  languageOptions: Language[];
  totalScore: number;
  maximumMarks: number;
  questions: SolutionQuestion[];
}

export interface AttemptHistoryItem {
  id: string;
  testId: string;
  testSlug: string | null;
  title: string;
  status: AttemptStatus;
  attemptNumber: number;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  resultVisible: boolean;
  result: {
    totalScore: number;
    maximumMarks: number;
    percentage: number;
    accuracy: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    timeTakenSeconds: number;
  } | null;
}

export interface Enrollment {
  _id: string;
  source: 'free' | 'purchase' | 'admin';
  expiresAt: string | null;
  enrolledAt: string;
  series: { _id: string; title: string; slug: string; coverImage: string; accessType: AccessType; examName: string; categoryId?: { name: string } | null };
  totalTests: number;
  completedTests: number;
}

export interface Question {
  _id: string;
  questionText: string;
  options: ExamOption[];
  correctOption: OptionKey;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  language: Language;
  translations: { language: Language; questionText: string; options: { key: OptionKey; text: string }[]; explanation: string }[];
  imageUrl: string;
  sourceExam: string;
  sourceYear: number | null;
  tags: string[];
  isActive: boolean;
  usedInTests?: number;
  createdAt: string;
}

export type SiteSettings = {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  logoUrl: string;
  mainWebsiteUrl: string;
  contactPhone: string;
  whatsappNumber: string;
  contactEmail: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  announcement: string;
  defaultExamInstructions: string;
  registrationOpen: boolean;
};
