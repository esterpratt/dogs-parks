import { useEffect } from 'react';
import type { AppLanguage } from '../../types/language';
import { queryClient } from '../../services/react-query';
import { parkKey } from './keys';
import { fetchParkWithTranslation } from '../../services/parks';

interface UsePrefetchParksWithTranslationParams {
  parkIds?: string[];
  language: AppLanguage;
}

function usePrefetchParksWithTranslation(
  params: UsePrefetchParksWithTranslationParams
): void {
  const { parkIds, language } = params;
  const parkIdsString = parkIds?.join(',');

  useEffect(() => {
    if (!parkIdsString) {
      return;
    }

    const parkIdsArray = parkIdsString.split(',');
    parkIdsArray.forEach((id) => {
      if (!id) {
        return;
      }

      queryClient.prefetchQuery({
        queryKey: parkKey(id, language),
        queryFn: () => fetchParkWithTranslation({ parkId: id, language }),
      });
    });
  }, [parkIdsString, language]);
}

export { usePrefetchParksWithTranslation };
