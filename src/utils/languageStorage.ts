import { Preferences } from '@capacitor/preferences';
import { isMobile } from './platform';
import type { AppLanguage } from '../types/language';
import { isAppLanguage } from './language';

const STORAGE_KEY = 'app:preferred_language';

function getPreferredLanguageSync(): AppLanguage | null {
  try {
    const preferredLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (isAppLanguage(preferredLanguage || '')) {
      return preferredLanguage as AppLanguage;
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
      if (isAppLanguage(value || '')) {
        return value as AppLanguage;
      }
    }
  } catch (error) {
    console.error('languageStorage.getPreferredLanguageAsync error', error);
  }
  return getPreferredLanguageSync();
}

async function setPreferredLanguage(lang: AppLanguage): Promise<void> {
  if (!isAppLanguage(lang)) {
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
  isAppLanguage,
};
