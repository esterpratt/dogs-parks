import { APP_LANGUAGES } from './consts';
import type { AppLanguage } from '../types/language';

/**
 * Derive canonical AppLanguage ('en' | 'he') from an arbitrary language tag.
 * Falls back to EN.
 */
function deriveAppLanguage(lang?: string): AppLanguage {
  const base = (lang ?? APP_LANGUAGES.EN).split('-')[0].toLowerCase();
  if (base === APP_LANGUAGES.HE) {
    return APP_LANGUAGES.HE;
  }
  return APP_LANGUAGES.EN;
}

/** Runtime type guard for AppLanguage */
function isAppLanguage(value: string): value is AppLanguage {
  return value === APP_LANGUAGES.EN || value === APP_LANGUAGES.HE;
}

const RTL_LANGS = new Set<AppLanguage>([APP_LANGUAGES.HE]);

/**
 * Check if the given language is RTL (Right-to-Left)
 * @param lang - The language code to check
 * @returns true if the language is RTL, false otherwise
 */
function isRTL(lang: string): boolean {
  const base = lang.split('-')[0].toLowerCase();
  return RTL_LANGS.has(base as AppLanguage);
}

export { deriveAppLanguage, isAppLanguage, isRTL };
