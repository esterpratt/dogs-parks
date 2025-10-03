import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchParksJSON } from '../services/parks';
import { APP_LANGUAGES } from '../utils/consts';
import type { ParkJSON as Park } from '../types/park';

function normalizeText(input: string): string {
  const lower = (input ?? '').toLowerCase();
  // Remove Latin diacritics + Hebrew niqqud, strip punctuation, collapse spaces
  return lower
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Latin diacritics
    .replace(/[\u0591-\u05C7]/g, '') // Hebrew niqqud
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildBlob(park: Park): string {
  return normalizeText(
    [park.name, park.city, park.address].filter(Boolean).join(' ')
  );
}

function useParksCrossLanguageFilter() {
  const availableLanguages = Object.values(APP_LANGUAGES);

  const languageQueries = useQueries({
    queries: availableLanguages.map((language) => ({
      queryKey: ['parks', language],
      queryFn: () => fetchParksJSON({ language }),
    })),
  });

  const searchBlobByParkId = useMemo(() => {
    const searchBlobMap = new Map<string, string>();

    availableLanguages.forEach((_language, index) => {
      const data = languageQueries[index]?.data ?? [];
      for (const park of data) {
        const prev = searchBlobMap.get(park.id) ?? '';
        const next = prev.length
          ? `${prev} | ${buildBlob(park)}`
          : buildBlob(park);
        searchBlobMap.set(park.id, next);
      }
    });

    return searchBlobMap;
  }, [languageQueries, availableLanguages]);

  const isLoading = languageQueries.some((q) => q.isLoading);
  const error = languageQueries.find((q) => q.error)?.error;

  const filterFunc = useMemo(() => {
    return (park: Park, userInput: string): boolean => {
      const normalizedSearchTerm = normalizeText(userInput);

      // let the parent decide if empty input should show all
      if (!normalizedSearchTerm) {
        return true;
      }

      const parkSearchBlob = searchBlobByParkId.get(park.id);

      // If we somehow don't have a blob yet (race), be conservative and keep the item
      if (!parkSearchBlob) {
        return true;
      }

      return parkSearchBlob.includes(normalizedSearchTerm);
    };
  }, [searchBlobByParkId]);

  return { filterFunc, isLoading, error };
}

export { useParksCrossLanguageFilter };
