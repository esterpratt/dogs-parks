import { Preferences } from '@capacitor/preferences';
import { isMobile } from './platform';
import type { AppLanguage } from '../types/language';
import { APP_LANGUAGES } from './consts';

const STORAGE_KEY = 'app:preferred_language';

export function toAppLanguage(value: string | null | undefined): AppLanguage {
  if (value === APP_LANGUAGES.HE) {
    return APP_LANGUAGES.HE;
  }
  return APP_LANGUAGES.EN;
}

function isValidLang(value: unknown): value is AppLanguage {
  return value === APP_LANGUAGES.EN || value === APP_LANGUAGES.HE;
}

function getPreferredLanguageSync(): AppLanguage | null {
  try {
    const preferredLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (isValidLang(preferredLanguage)) {
      return preferredLanguage;
    }
  } catch (error) {
    console.error('languageStorage.getPreferredLanguageSync error', error);
  }
  return null;
}

async function getPreferredLanguageAsync(): Promise<AppLanguage | null> {
  try {
    if (isMobile()) {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (isValidLang(value)) {
        return value;
      }
    }
  } catch (error) {
    console.error('languageStorage.getPreferredLanguageAsync error', error);
  }
  return getPreferredLanguageSync();
}

async function setPreferredLanguage(lang: AppLanguage): Promise<void> {
  if (!isValidLang(lang)) {
    console.error('languageStorage.setPreferredLanguage invalid lang', lang);
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.error(
      'languageStorage.setPreferredLanguage localStorage error',
      error
    );
  }

  try {
    if (isMobile()) {
      await Preferences.set({ key: STORAGE_KEY, value: lang });
    }
  } catch (error) {
    console.error(
      'languageStorage.setPreferredLanguage preferences error',
      error
    );
  }
}

export {
  getPreferredLanguageSync,
  getPreferredLanguageAsync,
  setPreferredLanguage,
  isValidLang,
};
