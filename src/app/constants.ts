export const APP_NAME = 'Civil Sansad';
export const MAIN_SITE_URL = 'https://civilsansad.com';
export const DEFAULT_LOGO = '/logo.webp';

export const ROUTES = {
  home: '/',
  testSeries: '/test-series',
  categories: '/categories',
  pyqs: '/pyqs',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  myTests: '/my-tests',
  myResults: '/my-results',
  attempts: '/attempts',
  profile: '/profile',
  adminLogin: '/admin/login',
  admin: '/admin',
} as const;

export const seriesUrl = (slug: string) => `/test-series/s/${slug}`;
export const categoryUrl = (path: string) => `/test-series/c/${path}`;
export const testUrl = (slug: string) => `/tests/${slug}`;
export const instructionsUrl = (slug: string) => `/tests/${slug}/instructions`;
export const examUrl = (attemptId: string) => `/exam/${attemptId}`;
export const resultUrl = (attemptId: string) => `/results/${attemptId}`;
export const solutionsUrl = (attemptId: string) => `/results/${attemptId}/solutions`;
export const pyqExamUrl = (exam: string) => `/pyqs/${exam}`;
export const pyqSubjectUrl = (exam: string, subject: string) => `/pyqs/${exam}/${subject}`;
export const pyqPaperUrl = (slug: string) => `/pyqs/paper/${slug}`;

export const QUERY_KEYS = {
  me: ['auth', 'me'] as const,
  settings: ['settings', 'public'] as const,
};
