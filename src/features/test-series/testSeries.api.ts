import { api } from '@/services/apiClient';
import type { SeriesDetail, SeriesSummary, TestDetail } from '@/types';
import type { CreateOrderResponse, HomeData, SeriesListParams } from './testSeries.types';

export const testSeriesApi = {
  list: (params: SeriesListParams) => api.page<SeriesSummary>('/test-series', params),
  home: () => api.get<HomeData>('/test-series/home'),
  detail: (slug: string) => api.get<SeriesDetail>(`/test-series/${slug}`),
  enroll: (seriesId: string) => api.post(`/test-series/${seriesId}/enroll`),
  test: (slug: string) => api.get<TestDetail>(`/tests/${slug}`),
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
