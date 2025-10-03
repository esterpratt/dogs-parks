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

  useEffect(() => {
    if (!parkIds || parkIds.length === 0) {
      return;
    }

    parkIds.forEach((id) => {
      if (!id) {
        return;
      }

      queryClient.prefetchQuery({
        queryKey: parkKey(id, language),
        queryFn: () => fetchParkWithTranslation({ parkId: id, language }),
      });
    });
  }, [parkIds?.join(','), language]);
}

export { usePrefetchParksWithTranslation };
