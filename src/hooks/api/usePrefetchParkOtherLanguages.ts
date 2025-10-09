import { useEffect } from 'react';
import { queryClient } from '../../services/react-query';
import { APP_LANGUAGES } from '../../utils/consts';
import { parkKey } from './keys';
import { fetchParkWithTranslation } from '../../services/parks';
import type { AppLanguage } from '../../types/language';

interface UsePrefetchParkOtherLanguagesParams {
  parkId?: string;
  currentLanguage: AppLanguage;
}

function usePrefetchParkOtherLanguages(
  params: UsePrefetchParkOtherLanguagesParams
): void {
  const { parkId, currentLanguage } = params;

  useEffect(() => {
    if (!parkId) {
      return;
    }

    const languages = Object.values(APP_LANGUAGES) as AppLanguage[];
    languages
      .filter((lang) => lang !== currentLanguage)
      .forEach((lang) => {
        queryClient.prefetchQuery({
          queryKey: parkKey(parkId, lang),
          queryFn: () => fetchParkWithTranslation({ parkId, language: lang }),
        });
      });
  }, [parkId, currentLanguage]);
}

export { usePrefetchParkOtherLanguages };
