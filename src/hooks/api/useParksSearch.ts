import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchParksJSON } from '../../services/parks';
import { parksKey } from './keys';
import { AppLanguage } from '../../types/language';
import { APP_LANGUAGES } from '../../utils/consts';
import { ParkJSON } from '../../types/park';

interface UseParksSearchParams {
  searchTerm: string;
  currentLanguage: AppLanguage;
}

const useParksSearch = (params: UseParksSearchParams) => {
  const { searchTerm, currentLanguage } = params;

  // Fetch both language versions for cross-language search
  const englishQuery = useQuery({
    queryKey: parksKey(APP_LANGUAGES.EN),
    queryFn: () => fetchParksJSON({ language: APP_LANGUAGES.EN }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  const hebrewQuery = useQuery({
    queryKey: parksKey(APP_LANGUAGES.HE),
    queryFn: () => fetchParksJSON({ language: APP_LANGUAGES.HE }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  // Perform cross-language search
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || (!englishQuery.data && !hebrewQuery.data)) {
      return [];
    }

    const allParks: ParkJSON[] = [];
    const seenIds = new Set<string>();

    // Get parks from current language first
    const currentLanguageData = currentLanguage === APP_LANGUAGES.EN ? englishQuery.data : hebrewQuery.data;
    const otherLanguageData = currentLanguage === APP_LANGUAGES.EN ? hebrewQuery.data : englishQuery.data;

    // Add current language results first
    if (currentLanguageData) {
      currentLanguageData.forEach((park) => {
        if (!seenIds.has(park.id)) {
          allParks.push(park);
          seenIds.add(park.id);
        }
      });
    }

    // Add other language results for parks not already included
    if (otherLanguageData) {
      otherLanguageData.forEach((park) => {
        if (!seenIds.has(park.id)) {
          allParks.push(park);
          seenIds.add(park.id);
        }
      });
    }

    // Filter parks based on search term (case-insensitive, searches name, city, address)
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allParks.filter((park) => {
      return (
        park.name.toLowerCase().includes(lowerSearchTerm) ||
        park.city.toLowerCase().includes(lowerSearchTerm) ||
        park.address.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [searchTerm, englishQuery.data, hebrewQuery.data, currentLanguage]);

  const isLoading = englishQuery.isLoading || hebrewQuery.isLoading;
  const error = englishQuery.error || hebrewQuery.error;

  return {
    searchResults,
    isLoading,
    error,
  };
};

export { useParksSearch };
