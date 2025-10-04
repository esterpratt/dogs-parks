/**
 * Normalize strings for fuzzy, cross-language search (EN/HE).
 * - Lowercase
 * - Remove Hebrew niqqud and geresh/gershayim
 * - Strip Latin diacritics (NFD)
 * - Remove punctuation, collapse spaces
 */
function normalizeForSearch(input: string): string {
  if (!input) {
    return '';
  }

  const lowered = input.toLowerCase();

  // Remove Hebrew niqqud + geresh/gershayim: \u0591-\u05C7, \u05F3 (geresh), \u05F4 (gershayim)
  const withoutHebrewMarks = lowered.replace(
    /[\u0591-\u05C7\u05F3\u05F4]/g,
    ''
  );

  // Strip Latin diacritics
  let withoutDiacritics = withoutHebrewMarks;
  try {
    withoutDiacritics = withoutHebrewMarks
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  } catch {
    // no-op if normalize isn't supported
  }

  // Remove punctuation, keep letters/numbers/spaces, collapse whitespace
  const cleaned = withoutDiacritics
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Normalize multiple tokens and join to one searchable string.
 * Use this directly anywhere you previously used buildSearchBlob.
 */
function joinSearchTokens(tokens: Array<string | undefined | null>): string {
  const normalizedTokens = tokens
    .filter((token) => !!token)
    .map((token) => normalizeForSearch(String(token)));
  return normalizedTokens.join(' ').trim();
}

/**
 * Factory to create a filter against a prebuilt blob map.
 * It returns a function that your lists can use as `filterFunc`.
 */
function makeBlobFilter<TItem>(
  getItemId: (item: TItem) => string,
  blobByItemId: Map<string, string>
) {
  return (item: TItem, userInput: string): boolean => {
    const normalizedQuery = normalizeForSearch(userInput);

    // Parent (SearchList) decides empty-query behavior; returning true shows all.
    if (!normalizedQuery) {
      return true;
    }

    const itemId = getItemId(item);
    const itemBlob = blobByItemId.get(itemId);

    // Be conservative on races: if blob not ready, don't hide the item.
    if (!itemBlob) {
      return true;
    }

    return itemBlob.includes(normalizedQuery);
  };
}

export { normalizeForSearch, joinSearchTokens, makeBlobFilter };
