import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useMemo, type ReactNode } from 'react';
import { QUERY_KEYS } from '@/app/constants';
import type { User } from '@/types';
import { authApi } from './auth.api';
import type { LoginInput, MeResponse, RegisterInput } from './auth.types';

export interface AuthContextValue {
  user: User | null;
  scope: 'student' | 'admin' | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  login: (input: LoginInput) => Promise<User>;
  adminLogin: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  refresh: () => Promise<unknown>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: authApi.me,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const setMe = useCallback((value: MeResponse) => qc.setQueryData(QUERY_KEYS.me, value), [qc]);

  /**
   * Drops cached private data (results, dashboards, admin lists) when the session changes.
   * The auth and public settings queries are kept - removing a query that has an active
   * observer would detach the observer and the UI would miss the new session.
   */
  const resetPrivateCache = useCallback(
    () => qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' && q.queryKey[0] !== 'settings' }),
    [qc],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const { user } = await authApi.login(input);
      resetPrivateCache();
      setMe({ user, scope: 'student' });
      return user;
    },
    [resetPrivateCache, setMe],
  );

  const adminLogin = useCallback(
    async (input: LoginInput) => {
      const { user } = await authApi.adminLogin(input);
      resetPrivateCache();
      setMe({ user, scope: 'admin' });
      return user;
    },
    [resetPrivateCache, setMe],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { user } = await authApi.register(input);
      resetPrivateCache();
      setMe({ user, scope: 'student' });
      return user;
    },
    [resetPrivateCache, setMe],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Drop every cached private response (results, dashboards, admin data).
      resetPrivateCache();
      setMe({ user: null });
    }
  }, [resetPrivateCache, setMe]);

  const setUser = useCallback((user: User | null) => setMe({ user, scope: data?.scope }), [setMe, data?.scope]);

  const value = useMemo<AuthContextValue>(() => {
    const user = data?.user ?? null;
    const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin') && data?.scope === 'admin';
    return {
      user,
      scope: data?.scope ?? null,
      isLoading,
      isAdmin,
      isStudent: !!user && user.role === 'student',
      login,
      adminLogin,
      register,
      logout,
      setUser,
      refresh: refetch,
    };
  }, [data, isLoading, login, adminLogin, register, logout, setUser, refetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
