import { useQuery } from '@tanstack/react-query';
import { DEFAULT_LOGO, QUERY_KEYS } from '@/app/constants';
import { api } from '@/services/apiClient';
import type { SiteSettings } from '@/types';

/** Public site settings (branding, contact details) managed from the admin panel. */
export function useSettings() {
  const query = useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => api.get<SiteSettings>('/settings/public'),
    staleTime: 5 * 60_000,
  });
  const s = query.data;
  return {
    ...query,
    settings: s,
    siteName: s?.siteName ?? 'Civil Sansad',
    // The logo is served locally so the page never depends on another host being up.
    logoUrl: s?.logoUrl && !s.logoUrl.includes('civilsansad.com/frontend/images/logo.webp') ? s.logoUrl : DEFAULT_LOGO,
  };
}
