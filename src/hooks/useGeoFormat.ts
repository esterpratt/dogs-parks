import { useMemo } from 'react';
import { useAppLocale } from '../hooks/useAppLocale';
import {
  formatDistanceKmForLocale,
  formatTravelDurationSecondsForLocale,
  type FormatDistanceParams,
  type FormatTravelDurationParams,
} from '../utils/geoFormat';

function useGeoFormat() {
  const locale = useAppLocale();

  return useMemo(() => {
    return {
      formatDistanceKm(params: FormatDistanceParams): string {
        return formatDistanceKmForLocale(params, locale);
      },
      formatTravelDurationSeconds(params: FormatTravelDurationParams): string {
        return formatTravelDurationSecondsForLocale(params, locale);
      },
    };
  }, [locale]);
}

export { useGeoFormat };
