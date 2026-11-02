import { api } from '@/services/apiClient';
import type { User } from '@/types';
import type { AuthResponse, LoginInput, MeResponse, RegisterInput } from './auth.types';

export const authApi = {
  me: () => api.get<MeResponse>('/auth/me'),
  login: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input),
  adminLogin: (input: LoginInput) => api.post<AuthResponse>('/auth/admin/login', input),
  register: (input: RegisterInput) => api.post<AuthResponse>('/auth/register', input),
  logout: () => api.post<null>('/auth/logout'),
  logoutAll: () => api.post<null>('/auth/logout-all'),
  forgotPassword: (email: string) => api.postWithMessage<null>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.postWithMessage<null>('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) => api.postWithMessage<null>('/auth/change-password', { currentPassword, newPassword }),
  changeEmail: (currentPassword: string, newEmail: string) => api.postWithMessage<{ user: User }>('/auth/change-email', { currentPassword, newEmail }),
  updateProfile: (input: { name?: string; mobile?: string; preferredLanguage?: 'en' | 'hi' }) => api.patch<{ user: User }>('/users/me', input),
};
