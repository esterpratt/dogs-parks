import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchParkWithTranslation } from '../../services/parks';
import { AppLanguage } from '../../types/language';
import { parkKey } from './keys';

interface UseParkWithTranslationParams {
  parkId: string;
  language: AppLanguage;
}

const useParkWithTranslation = (params: UseParkWithTranslationParams) => {
  const { parkId, language } = params;

  const query = useQuery({
    queryKey: parkKey(parkId, language),
    queryFn: () => fetchParkWithTranslation({ parkId, language }),
    placeholderData: keepPreviousData,
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
