import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/app/constants';
import { useAuth } from '@/features/auth/useAuth';
import { Loader } from './Loader';

/**
 * UX guard only - the API enforces every permission on the server.
 * `role="student"` requires a student session; `role="admin"` requires an admin-portal session.
 */
export function ProtectedRoute({ role, children }: { role: 'student' | 'admin'; children?: ReactNode }) {
  const { user, isLoading, isAdmin, isStudent } = useAuth();
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;

  if (isLoading) return <Loader fullScreen label="Checking your session..." />;

  if (role === 'admin') {
    if (!isAdmin) return <Navigate to={`${ROUTES.adminLogin}?from=${encodeURIComponent(from)}`} replace />;
  } else if (!user) {
    return <Navigate to={`${ROUTES.login}?from=${encodeURIComponent(from)}`} replace />;
  } else if (!isStudent) {
    return <Navigate to={ROUTES.admin} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

/** Sends signed-in users away from login/register pages. */
export function GuestOnly({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  if (isLoading) return <Loader fullScreen />;
  const from = new URLSearchParams(location.search).get('from');
  if (admin && isAdmin) return <Navigate to={from?.startsWith('/admin') ? from : ROUTES.admin} replace />;
  if (!admin && user && !isAdmin) return <Navigate to={from && from.startsWith('/') && !from.startsWith('//') ? from : ROUTES.dashboard} replace />;
  return <>{children}</>;
}
