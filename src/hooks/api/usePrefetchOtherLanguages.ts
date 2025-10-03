import { useEffect } from 'react';
import { queryClient } from '../../services/react-query';
import { APP_LANGUAGES } from '../../utils/consts';
import { parksKey } from './keys';
import { fetchParksJSON } from '../../services/parks';
import type { AppLanguage } from '../../types/language';

interface UsePrefetchOtherLanguagesParams {
  currentLanguage: AppLanguage;
}

function usePrefetchOtherLanguages(
  params: UsePrefetchOtherLanguagesParams
): void {
  const { currentLanguage } = params;

  useEffect(() => {
    const languages = Object.values(APP_LANGUAGES) as AppLanguage[];
    languages
      .filter((lang) => lang !== currentLanguage)
      .forEach((lang) => {
        queryClient.prefetchQuery({
          queryKey: parksKey(lang),
          queryFn: () => fetchParksJSON({ language: lang }),
        });
      });
  }, [currentLanguage]);
}

export { usePrefetchOtherLanguages };
