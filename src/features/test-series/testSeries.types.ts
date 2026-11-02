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

/** A published test that sits directly in a category (no series) - e.g. an automatic practice set. */
export interface CategoryTest {
  _id: string;
  title: string;
  hi?: { title?: string };
  slug: string;
  description: string;
  testType: string;
  durationSeconds: number;
  totalMarks: number;
  isFree: boolean;
  languageOptions: string[];
  questionCount: number;
  isPracticeSet: boolean;
}
