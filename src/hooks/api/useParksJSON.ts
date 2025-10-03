import { useQuery } from '@tanstack/react-query';
import { fetchParksJSON } from '../../services/parks';
import { parksKey } from './keys';
import { AppLanguage } from '../../types/language';

interface UseParksJSONParams {
  language: AppLanguage;
}

const useParksJSON = (params: UseParksJSONParams) => {
  const { language } = params;

  const query = useQuery({
    queryKey: parksKey(language),
    queryFn: () => fetchParksJSON({ language }),
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
