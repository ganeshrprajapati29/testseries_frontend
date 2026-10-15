import { useQuery } from '@tanstack/react-query';
import { testSeriesApi } from '../test-series/testSeries.api';

export function useHomeData() {
  return useQuery({ queryKey: ['home'], queryFn: testSeriesApi.home, staleTime: 60_000 });
}
