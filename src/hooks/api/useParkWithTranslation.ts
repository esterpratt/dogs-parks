import { useQuery } from '@tanstack/react-query';
import { fetchParkWithTranslation } from '../../services/parks';
import { parkKey } from './keys';
import { AppLanguage } from '../../types/language';

interface UseParkWithTranslationParams {
  parkId: string;
  language: AppLanguage;
}

const useParkWithTranslation = (params: UseParkWithTranslationParams) => {
  const { parkId, language } = params;

  const query = useQuery({
    queryKey: parkKey(parkId, language),
    queryFn: () => fetchParkWithTranslation({ parkId, language }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - long cache for park data with translations
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in memory longer
    keepPreviousData: true, // Keep previous data when language changes for smooth transitions
  });

  return {
    park: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

export { useParkWithTranslation };
