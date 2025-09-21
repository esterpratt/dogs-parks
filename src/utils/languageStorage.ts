import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export type AppLanguage = 'en' | 'he';

const STORAGE_KEY = 'preferredLanguage';

function isValidLang(value: string | null | undefined): value is AppLanguage {
  return value === 'en' || value === 'he';
}

// Read synchronously to avoid UI jump on initial render (works in web and native webview)
function getPreferredLanguageSync(): AppLanguage | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (isValidLang(val)) {
      return val;
    }
  } catch (error) {
    console.error('languageStorage.getPreferredLanguageSync error', error);
  }
  return null;
}

// Optional helper if you ever want to double-check Capacitor Preferences asynchronously
async function getPreferredLanguageAsync(): Promise<AppLanguage | null> {
  try {
    if (Capacitor.isNativePlatform()) {
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

// Write to localStorage immediately; mirror to Preferences on native.
async function setPreferredLanguage(lang: AppLanguage): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.error(
      'languageStorage.setPreferredLanguage localStorage error',
      error
    );
  }
  try {
    if (Capacitor.isNativePlatform()) {
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
  STORAGE_KEY,
  getPreferredLanguageSync,
  getPreferredLanguageAsync,
  setPreferredLanguage,
};
