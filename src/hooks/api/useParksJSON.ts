import { useQuery } from '@tanstack/react-query';
import { fetchParksJSON } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { parksKey } from './keys';
import { AppLanguage } from '../../types/language';
import { APP_LANGUAGES } from '../../utils/consts';

interface UseParksJSONParams {
  language: AppLanguage;
}

const useParksJSON = (params: UseParksJSONParams) => {
  const { language } = params;

  const query = useQuery({
    queryKey: parksKey(language),
    queryFn: () => fetchParksJSON({ language }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - long cache for JSON data
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory longer
  });

  // Prefetch opposite language in background for cross-language search
  const prefetchOppositeLanguage = () => {
    const oppositeLanguage = language === APP_LANGUAGES.EN ? APP_LANGUAGES.HE : APP_LANGUAGES.EN;
    
    queryClient.prefetchQuery({
      queryKey: parksKey(oppositeLanguage),
      queryFn: () => fetchParksJSON({ language: oppositeLanguage }),
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
  };

  // Prefetch opposite language after initial data is loaded
  if (query.data && !query.isFetching) {
    prefetchOppositeLanguage();
  }

  return {
    parks: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

export { useParksJSON };
