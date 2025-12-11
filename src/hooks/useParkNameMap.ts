import { useQuery } from '@tanstack/react-query';
import { useAppLocale } from './useAppLocale';
import { fetchParksJSON } from '../services/parks';
import { parksKey } from './api/keys';
import { buildParkNameMap } from '../utils/parkNamesMap';

const useParkNamesMap = () => {
  const currentLanguage = useAppLocale();

  const { data: parkNamesMap, isLoading } = useQuery({
    queryKey: parksKey(currentLanguage),
    queryFn: () => fetchParksJSON({ language: currentLanguage }),
    placeholderData: (previous) => previous,
    select: (parks) => buildParkNameMap(parks),
    retry: 0,
  });

  return { parkNamesMap, isLoading };
};

export { useParkNamesMap };
