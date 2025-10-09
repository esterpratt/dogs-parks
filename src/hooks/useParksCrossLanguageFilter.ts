import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchParksJSON } from '../services/parks';
import { APP_LANGUAGES } from '../utils/consts';
import type { ParkJSON as Park } from '../types/park';
import { joinSearchTokens, makeBlobFilter } from '../utils/search';
import { parksKey } from './api/keys';

function useParksCrossLanguageFilter() {
  const availableLanguages = Object.values(APP_LANGUAGES);

  const languageQueries = useQueries({
    queries: availableLanguages.map((language) => ({
      queryKey: parksKey(language),
      queryFn: () => fetchParksJSON({ language }),
    })),
  });

  // Build one normalized blob per park id from all languages
  const searchBlobByParkId = useMemo(() => {
    const blobMap = new Map<string, string>();

    for (
      let languageIndex = 0;
      languageIndex < availableLanguages.length;
      languageIndex += 1
    ) {
      const parksInLanguage = languageQueries[languageIndex]?.data ?? [];

      for (const park of parksInLanguage) {
        const previousBlob = blobMap.get(park.id) ?? '';
        const currentLanguageBlob = joinSearchTokens([
          park.name,
          park.city,
          park.address,
        ]);
        const combinedBlob =
          previousBlob.length > 0
            ? `${previousBlob} ${currentLanguageBlob}`
            : currentLanguageBlob;

        blobMap.set(park.id, combinedBlob);
      }
    }

    return blobMap;
  }, [languageQueries, availableLanguages]);

  const isLoading = languageQueries.some(
    (queryResult) => queryResult.isLoading
  );
  const error = languageQueries.find((queryResult) => queryResult.error)?.error;

  const filterFunc = useMemo(() => {
    return makeBlobFilter<Park>((park) => park.id, searchBlobByParkId);
  }, [searchBlobByParkId]);

  return { filterFunc, isLoading, error };
}

export { useParksCrossLanguageFilter };
