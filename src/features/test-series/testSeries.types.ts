export type { SeriesDetail, SeriesSummary, SeriesTest, TestDetail } from '@/types';

export interface SeriesListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  accessType?: 'free' | 'paid' | '';
  featured?: boolean;
  sort?: 'popular' | 'newest' | 'price_asc' | 'price_desc';
  [key: string]: string | number | boolean | undefined;
}

export interface HomeData {
  stats: { seriesCount: number; testCount: number; pyqPaperCount: number; questionCount: number };
  featured: import('@/types').SeriesSummary[];
}

export interface CreateOrderResponse {
  orderId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  seriesTitle: string;
  prefill: { name: string; email: string; contact: string };
}
