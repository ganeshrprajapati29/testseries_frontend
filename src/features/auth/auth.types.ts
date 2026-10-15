import type { User } from '@/types';

export interface MeResponse {
  user: User | null;
  scope?: 'student' | 'admin';
}

export interface AuthResponse {
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  mobile?: string;
  password: string;
}
