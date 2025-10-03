// hooks/useParksCrossLanguageFilter.ts
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
  // ---------------- changed by me: centralize fields we search on ----------------
  return normalizeText(
    [park.name, park.city, park.address].filter(Boolean).join(' ')
  );
}

function useParksCrossLanguageFilter() {
  // ---------------- changed by me: pull all languages so users can search in any language ----------------
  const availableLanguages = Object.values(APP_LANGUAGES);

  const languageQueries = useQueries({
    queries: availableLanguages.map((language) => ({
      queryKey: ['parks', language],
      queryFn: () => fetchParksJSON({ language }),
    })),
  });

  // Build: parkId -> combined searchable blob (across ALL languages)
  const blobById = useMemo(() => {
    const map = new Map<string, string>();

    availableLanguages.forEach((language, idx) => {
      const data = languageQueries[idx]?.data ?? [];
      for (const park of data) {
        const prev = map.get(park.id) ?? '';
        const next = prev.length
          ? `${prev} | ${buildBlob(park)}`
          : buildBlob(park);
        map.set(park.id, next);
      }
    });

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageQueries]);

  const isLoading = languageQueries.some((q) => q.isLoading);
  const error = languageQueries.find((q) => q.error)?.error;

  // ---------------- changed by me: return a synchronous filterFunc that uses the prebuilt blobs ----------------
  const filterFunc = useMemo(() => {
    return (item: Park, searchInput: string): boolean => {
      const term = normalizeText(searchInput);
      if (!term) {
        return true; // let the parent decide if empty input should show all
      }
      const blob = blobById.get(item.id);
      if (!blob) {
        // If we somehow don't have a blob yet (race), be conservative and keep the item
        return true;
      }
      return blob.includes(term);
    };
  }, [blobById]);

  return { filterFunc, isLoading, error };
}

export { useParksCrossLanguageFilter };
