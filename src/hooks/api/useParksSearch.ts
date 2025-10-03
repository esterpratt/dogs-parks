import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchParksJSON } from '../../services/parks';
import { parksKey } from './keys';
import { AppLanguage } from '../../types/language';
import { APP_LANGUAGES } from '../../utils/consts';
import { ParkJSON } from '../../types/park';

interface UseParksSearchParams {
  searchTerm: string;
  currentLanguage: AppLanguage;
}

type ParkByLanguageMap = {
  [language in AppLanguage]?: ParkJSON;
};

interface ParkSearchBundle {
  id: string;
  // Concatenated, normalized searchable text across ALL languages
  searchBlob: string;
  // The versions of this park keyed by language, for display selection
  byLanguage: ParkByLanguageMap;
}

function normalizeText(input: string): string {
  // --- changed by me: robust normalization so searches are language-agnostic ---
  // 1) lower
  // 2) NFKD + strip diacritics (incl. Hebrew niqqud)
  // 3) remove punctuation-like chars
  // 4) collapse whitespace
  const lower = input.toLowerCase();
  const noDiacritics = lower
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Latin diacritics
    .replace(/[\u0591-\u05C7]/g, ''); // Hebrew niqqud
  const noPunct = noDiacritics.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  return noPunct.replace(/\s+/g, ' ').trim();
}

function buildSearchBlob(park: ParkJSON): string {
  // --- changed by me: make it easy to extend searchable fields later ---
  const parts = [park.name, park.city, park.address].filter(Boolean);
  return normalizeText(parts.join(' '));
}

const useParksSearch = (params: UseParksSearchParams) => {
  const { searchTerm, currentLanguage } = params;

  // NOTE: If you later add Arabic, etc., this automatically participates.
  const availableLanguages = Object.values(APP_LANGUAGES);

  const languageQueries = useQueries({
    queries: availableLanguages.map((language) => ({
      queryKey: parksKey(language),
      queryFn: () => fetchParksJSON({ language }),
      // --- changed by me: these datasets are fairly static; reduce refetch churn ---
      staleTime: 5 * 60 * 1000,
    })),
  });

  // --- changed by me: build a per-park bundle that merges ALL languages before filtering ---
  const mergedParkBundles: ParkSearchBundle[] = useMemo(() => {
    // Collect all parks grouped by ID, keeping each language version
    const byId: Record<string, ParkByLanguageMap> = {};

    availableLanguages.forEach((language, idx) => {
      const data = languageQueries[idx]?.data ?? [];
      data.forEach((park) => {
        if (!byId[park.id]) {
          byId[park.id] = {};
        }
        (byId[park.id] as ParkByLanguageMap)[language] = park;
      });
    });

    // Build search bundles combining searchable text across languages
    const bundles: ParkSearchBundle[] = Object.entries(byId).map(
      ([id, byLanguage]) => {
        const blobs: string[] = [];

        availableLanguages.forEach((lang) => {
          const version = (byLanguage as ParkByLanguageMap)[lang];
          if (version) {
            blobs.push(buildSearchBlob(version));
          }
        });

        return {
          id,
          searchBlob: blobs.join(' | '),
          byLanguage,
        };
      }
    );

    return bundles;
  }, [availableLanguages, languageQueries]);

  // --- changed by me: search using the cross-language blob, but display current-lang version when possible ---
  const searchResults: ParkJSON[] = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (term.length === 0) {
      return [];
    }

    // Filter by cross-language blob
    const matched = mergedParkBundles.filter((bundle) =>
      bundle.searchBlob.includes(term)
    );

    // Choose display version:
    // 1) prefer currentLanguage version
    // 2) otherwise first available language version (stable order via availableLanguages)
    const results: ParkJSON[] = matched.map((bundle) => {
      const preferred = bundle.byLanguage[currentLanguage];
      if (preferred) {
        return preferred;
      }
      for (const lang of availableLanguages) {
        const fallback = (bundle.byLanguage as ParkByLanguageMap)[lang];
        if (fallback) {
          return fallback;
        }
      }
      // Shouldn’t happen, but keep types happy
      return Object.values(bundle.byLanguage)[0] as ParkJSON;
    });

    // --- changed by me: light ranking to prioritize matches present in current language fields ---
    const currentLangTerm = normalizeText(searchTerm);
    const score = (park: ParkJSON): number => {
      const blobCurrent = buildSearchBlob(park);
      // higher score if the match exists in the current language fields
      return blobCurrent.includes(currentLangTerm) ? 2 : 1;
    };

    results.sort((a, b) => score(b) - score(a));

    return results;
  }, [searchTerm, mergedParkBundles, availableLanguages, currentLanguage]);

  const isLoading = languageQueries.some((q) => q.isLoading);
  const error = languageQueries.find((q) => q.error)?.error;

  return {
    searchResults,
    isLoading,
    error,
  };
};

export { useParksSearch };
