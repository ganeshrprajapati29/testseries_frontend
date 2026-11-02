import { api } from '@/services/apiClient';
import { API_BASE_URL } from '@/lib/axios';
import type { PrintablePaper, SeriesDetail, SeriesSummary, SeriesTest, TestDetail } from '@/types';
import type { CategoryTest, CreateOrderResponse, HomeData, SeriesListParams } from './testSeries.types';

export const testSeriesApi = {
  list: (params: SeriesListParams) => api.page<SeriesSummary>('/test-series', params),
  home: () => api.get<HomeData>('/test-series/home'),
  detail: (slug: string) => api.get<SeriesDetail>(`/test-series/${slug}`),
  tests: (slug: string, params: { page: number; limit: number; type?: string }) => api.page<SeriesTest>(`/test-series/${slug}/tests`, params),
  enroll: (seriesId: string) => api.post(`/test-series/${seriesId}/enroll`),
  /** Published tests placed directly in a category (practice sets and stand-alone tests). */
  categoryTests: (categoryId: string, page: number, moduleType: 'TEST_SERIES' | 'PYQS' = 'TEST_SERIES') =>
    api.page<CategoryTest>('/tests', { category: categoryId, moduleType, page, limit: 9 }),
  test: (slug: string) => api.get<TestDetail>(`/tests/${slug}`),
  paper: (slug: string) => api.get<PrintablePaper>(`/tests/${slug}/paper`),
  pdfUrl: (slug: string, kind: 'question-paper' | 'solutions', download = false) => `${API_BASE_URL}/tests/${slug}/pdf/${kind}${download ? '?download=1' : ''}`,
};

export const paymentsApi = {
  config: () => api.get<{ enabled: boolean; keyId: string | null; currency: string }>('/payments/config'),
  createOrder: (testSeriesId: string) => api.post<CreateOrderResponse>('/payments/orders', { testSeriesId }),
  verify: (body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post<{ orderId: string; status: string; testSeriesId: string }>('/payments/verify', body),
};

let razorpayScript: Promise<void> | null = null;
export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  razorpayScript ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      razorpayScript = null;
      reject(new Error('Could not load the payment window. Please check your connection.'));
    };
    document.body.appendChild(s);
  });
  return razorpayScript;
}
