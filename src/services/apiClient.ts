import { AxiosError, type AxiosRequestConfig } from 'axios';
import { http } from '@/lib/axios';
import type { PageMeta } from '@/types';

export interface ApiErrorDetail {
  path?: string;
  message: string;
}

/** Normalised error thrown by every API helper. */
export class ApiError extends Error {
  status: number;
  code: string;
  details: ApiErrorDetail[];

  constructor(message: string, status = 0, code = 'NETWORK_ERROR', details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field errors keyed by the last path segment ("body.email" -> "email"). */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const d of this.details) {
      if (!d.path) continue;
      const key = d.path.replace(/^(body|query|params)\./, '');
      out[key] ??= d.message;
    }
    return out;
  }
}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PageMeta;
  error?: { code: string; message: string; details?: ApiErrorDetail[] };
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof AxiosError) {
    const body = err.response?.data as Envelope<unknown> | undefined;
    if (body?.error) return new ApiError(body.error.message, err.response!.status, body.error.code, body.error.details ?? []);
    if (err.code === 'ECONNABORTED') return new ApiError('The request timed out. Please check your connection.', 0, 'TIMEOUT');
    if (!err.response) return new ApiError('Unable to reach the server. Please check your internet connection.', 0, 'NETWORK_ERROR');
    return new ApiError(`Request failed (${err.response.status})`, err.response.status, 'HTTP_ERROR');
  }
  return new ApiError(err instanceof Error ? err.message : 'Unexpected error', 0, 'UNKNOWN');
}

async function request<T>(config: AxiosRequestConfig): Promise<{ data: T; meta?: PageMeta; message?: string }> {
  try {
    const res = await http.request<Envelope<T>>(config);
    if (res.status === 204) return { data: undefined as T };
    return { data: res.data.data, meta: res.data.meta, message: res.data.message };
  } catch (err) {
    throw toApiError(err);
  }
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

type Params = Record<string, string | number | boolean | undefined | null>;

function cleanParams(params?: Params) {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

export const api = {
  get: async <T>(url: string, params?: Params) => (await request<T>({ method: 'GET', url, params: cleanParams(params) })).data,
  page: async <T>(url: string, params?: Params): Promise<Paginated<T>> => {
    const res = await request<T[]>({ method: 'GET', url, params: cleanParams(params) });
    return { items: res.data, meta: res.meta ?? { page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 } };
  },
  post: async <T>(url: string, body?: unknown) => (await request<T>({ method: 'POST', url, data: body ?? {} })).data,
  postWithMessage: async <T>(url: string, body?: unknown) => request<T>({ method: 'POST', url, data: body ?? {} }),
  put: async <T>(url: string, body?: unknown) => (await request<T>({ method: 'PUT', url, data: body ?? {} })).data,
  patch: async <T>(url: string, body?: unknown) => (await request<T>({ method: 'PATCH', url, data: body ?? {} })).data,
  delete: async <T>(url: string) => (await request<T>({ method: 'DELETE', url })).data,
  upload: async <T>(url: string, form: FormData) => (await request<T>({ method: 'POST', url, data: form, timeout: 120000 })).data,
  /** Downloads a file (CSV export etc.) through the authenticated session. */
  download: async (url: string, filename: string, params?: Params) => {
    try {
      const res = await http.get(url, { params: cleanParams(params), responseType: 'blob' });
      const href = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (err) {
      throw toApiError(err);
    }
  },
};

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
