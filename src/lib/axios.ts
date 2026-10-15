import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const CSRF_COOKIE = 'cs_csrf';
const SAFE_METHODS = ['get', 'head', 'options'];

export function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

let csrfPromise: Promise<void> | null = null;
export function ensureCsrf(force = false): Promise<void> {
  if (!force && readCookie(CSRF_COOKIE)) return Promise.resolve();
  csrfPromise ??= http
    .get('/auth/csrf')
    .then(() => undefined)
    .finally(() => {
      csrfPromise = null;
    });
  return csrfPromise;
}

http.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (!SAFE_METHODS.includes(method)) {
    await ensureCsrf();
    const token = readCookie(CSRF_COOKIE);
    if (token) config.headers.set('X-CSRF-Token', token);
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean };

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: { code?: string } }>) => {
    const config = error.config as RetriableConfig | undefined;
    // CSRF cookie expired or rotated in another tab: refresh it once and retry.
    if (config && !config._csrfRetried && error.response?.status === 403 && error.response.data?.error?.code === 'CSRF_FAILED') {
      config._csrfRetried = true;
      await ensureCsrf(true);
      const token = readCookie(CSRF_COOKIE);
      if (token) config.headers.set('X-CSRF-Token', token);
      return http.request(config);
    }
    return Promise.reject(error);
  },
);
