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

export { deriveAppLanguage, isAppLanguage };
