import { useQuery } from '@tanstack/react-query';
import { fetchParksJSON } from '../../services/parks';
import { parksKey } from './keys';
import { AppLanguage } from '../../types/language';
import type { ParkJSON } from '../../types/park';

interface UseParksJSONParams {
  language: AppLanguage;
}

const useParksJSON = (params: UseParksJSONParams) => {
  const { language } = params;

  // changed: keep previous data during language switch and avoid retries
  const query = useQuery<ParkJSON[]>({
    queryKey: parksKey(language),
    queryFn: () => fetchParksJSON({ language }),
    placeholderData: (previous) => previous,
    retry: 0,
  });

  return {
    parks: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

export { useParksJSON };
