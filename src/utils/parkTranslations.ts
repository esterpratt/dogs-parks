import type { Park, ParkJSON } from '../types/park';

interface ResolveTranslatedParkParams {
  activePark?: Park | ParkJSON | null;
  preferred?: ParkJSON | null;
  fallback?: ParkJSON | null;
}

// Resolve translated display fields (name, city, address) with fallbacks.
function resolveTranslatedPark(params: ResolveTranslatedParkParams) {
  const { activePark, preferred, fallback } = params;

  const displayName =
    preferred?.name || fallback?.name || activePark?.name || '';
  const displayCity =
    preferred?.city || fallback?.city || activePark?.city || '';
  const displayAddress =
    preferred?.address || fallback?.address || activePark?.address || '';

  return { name: displayName, city: displayCity, address: displayAddress };
}

export { resolveTranslatedPark };
