import { lazy } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { GuestOnly, ProtectedRoute } from '@/components/common/ProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { StudentLayout } from '@/components/layout/StudentLayout';
import NotFoundPage from './NotFoundPage';

// Public
const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const CategoriesPage = lazy(() => import('@/features/categories/pages/CategoriesPage'));
const CategoryDetailPage = lazy(() => import('@/features/categories/pages/CategoryDetailPage'));
const TestSeriesPage = lazy(() => import('@/features/test-series/pages/TestSeriesPage'));
const TestSeriesDetailPage = lazy(() => import('@/features/test-series/pages/TestSeriesDetailPage'));
const TestDetailPage = lazy(() => import('@/features/test-series/pages/TestDetailPage'));
const PYQsHomePage = lazy(() => import('@/features/pyqs/pages/PYQsHomePage'));
const PYQCategoryPage = lazy(() => import('@/features/pyqs/pages/PYQCategoryPage'));
const PYQSubjectPage = lazy(() => import('@/features/pyqs/pages/PYQSubjectPage'));
const PYQPaperPage = lazy(() => import('@/features/pyqs/pages/PYQPaperPage'));
// Auth
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
// Student
const StudentDashboard = lazy(() => import('@/features/student/pages/StudentDashboard'));
const MyTestsPage = lazy(() => import('@/features/student/pages/MyTestsPage'));
const MyResultsPage = lazy(() => import('@/features/student/pages/MyResultsPage'));
const AttemptHistoryPage = lazy(() => import('@/features/student/pages/AttemptHistoryPage'));
const ProfilePage = lazy(() => import('@/features/student/pages/ProfilePage'));
// Examination
const ExamInstructionsPage = lazy(() => import('@/features/examination/pages/ExamInstructionsPage'));
const ExamPage = lazy(() => import('@/features/examination/pages/ExamPage'));
const ExamResultPage = lazy(() => import('@/features/examination/pages/ExamResultPage'));
const SolutionsPage = lazy(() => import('@/features/examination/pages/SolutionsPage'));
// Admin
const AdminLoginPage = lazy(() => import('@/features/admin/pages/AdminLoginPage'));
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard'));
const AdminCategoriesPage = lazy(() => import('@/features/admin/pages/AdminCategoriesPage'));
const AdminTestSeriesPage = lazy(() => import('@/features/admin/pages/AdminTestSeriesPage'));
const AdminSeriesDetailPage = lazy(() => import('@/features/admin/pages/AdminSeriesDetailPage'));
const AdminTestsPage = lazy(() => import('@/features/admin/pages/AdminTestsPage'));
const AdminTestDetailPage = lazy(() => import('@/features/admin/pages/AdminTestDetailPage'));
const AdminQuestionsPage = lazy(() => import('@/features/admin/pages/AdminQuestionsPage'));
const AdminPYQsPage = lazy(() => import('@/features/admin/pages/AdminPYQsPage'));
const AdminImportsPage = lazy(() => import('@/features/admin/pages/AdminImportsPage'));
const AdminStudentsPage = lazy(() => import('@/features/admin/pages/AdminStudentsPage'));
const AdminAttemptsPage = lazy(() => import('@/features/admin/pages/AdminAttemptsPage'));
const AdminResultsPage = lazy(() => import('@/features/admin/pages/AdminResultsPage'));
const AdminSettingsPage = lazy(() => import('@/features/admin/pages/AdminSettingsPage'));
const AdminAuditLogsPage = lazy(() => import('@/features/admin/pages/AdminAuditLogsPage'));

function Root() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'test-series', element: <TestSeriesPage /> },
          { path: 'test-series/c/*', element: <CategoryDetailPage /> },
          { path: 'test-series/s/:slug', element: <TestSeriesDetailPage /> },
          { path: 'tests/:slug', element: <TestDetailPage /> },
          { path: 'pyqs', element: <PYQsHomePage /> },
          { path: 'pyqs/paper/:slug', element: <PYQPaperPage /> },
          { path: 'pyqs/:exam', element: <PYQCategoryPage /> },
          { path: 'pyqs/:exam/:subject', element: <PYQSubjectPage /> },
          { path: 'login', element: <GuestOnly><LoginPage /></GuestOnly> },
          { path: 'register', element: <GuestOnly><RegisterPage /></GuestOnly> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
          {
            element: <ProtectedRoute role="student" />,
            children: [
              { path: 'tests/:slug/instructions', element: <ExamInstructionsPage /> },
              { path: 'results/:attemptId', element: <ExamResultPage /> },
              { path: 'results/:attemptId/solutions', element: <SolutionsPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <ProtectedRoute role="student" />,
        children: [
          {
            element: <StudentLayout />,
            children: [
              { path: 'dashboard', element: <StudentDashboard /> },
              { path: 'my-tests', element: <MyTestsPage /> },
              { path: 'my-results', element: <MyResultsPage /> },
              { path: 'attempts', element: <AttemptHistoryPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
          { path: 'exam/:attemptId', element: <ExamPage /> },
        ],
      },
      { path: 'admin/login', element: <GuestOnly admin><AdminLoginPage /></GuestOnly> },
      { path: 'admin/forgot-password', element: <ForgotPasswordPage admin /> },
      { path: 'admin/reset-password', element: <ResetPasswordPage admin /> },
      {
        path: 'admin',
        element: <ProtectedRoute role="admin" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: 'categories', element: <AdminCategoriesPage /> },
              { path: 'test-series', element: <AdminTestSeriesPage /> },
              { path: 'test-series/:id', element: <AdminSeriesDetailPage /> },
              { path: 'tests', element: <AdminTestsPage /> },
              { path: 'tests/:id', element: <AdminTestDetailPage /> },
              { path: 'questions', element: <AdminQuestionsPage /> },
              { path: 'pyqs', element: <AdminPYQsPage /> },
              { path: 'imports', element: <AdminImportsPage /> },
              { path: 'students', element: <AdminStudentsPage /> },
              { path: 'attempts', element: <AdminAttemptsPage /> },
              { path: 'results', element: <AdminResultsPage /> },
              { path: 'settings', element: <AdminSettingsPage /> },
              { path: 'audit-logs', element: <AdminAuditLogsPage /> },
              { path: '*', element: <NotFoundPage admin /> },
            ],
          },
        ],
      },
    ],
  },
]);
