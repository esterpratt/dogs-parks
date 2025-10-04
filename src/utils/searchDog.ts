import { APP_LANGUAGES } from './consts';
import { normalizeForSearch } from './search';

interface DoesBreedMatchParams {
  breedId: string;
  rawUserInput: string;
  translate: (key: string, options?: Record<string, unknown>) => string;
  currentLanguage: string;
}

function doesBreedMatchUserInput(params: DoesBreedMatchParams): boolean {
  const { breedId, rawUserInput, translate } = params;

  if (!rawUserInput) {
    return true;
  }

  const supportedLanguages = Object.values(APP_LANGUAGES);

  const normalizedQuery = normalizeForSearch(rawUserInput);

  // Collect labels across locales with a Set to avoid duplicates.
  const searchTokenSet = new Set<string>();

  // Always include the stable id
  searchTokenSet.add(breedId);

  // Include label in current language (fall back to id)
  const currentLocaleLabel =
    translate(`dogs.breeds.${breedId}`, { defaultValue: breedId }) || breedId;
  searchTokenSet.add(currentLocaleLabel);

  // Include labels for all supported languages (fall back to id)
  for (const languageCode of supportedLanguages) {
    const localizedLabel =
      translate(`dogs.breeds.${breedId}`, {
        lng: languageCode,
        defaultValue: breedId,
      }) || breedId;
    searchTokenSet.add(localizedLabel);
  }

  // Convert to array and test with normalized substring matching.
  const searchTokens = Array.from(searchTokenSet);

  return searchTokens.some((token) => {
    return normalizeForSearch(token).includes(normalizedQuery);
  });
}

export { doesBreedMatchUserInput };
