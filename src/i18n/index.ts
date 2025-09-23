import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import he from './locales/he.json';
import dayjs from 'dayjs';
import 'dayjs/locale/he';

const resources = {
  en: { translation: en },
  he: { translation: he },
} as const;

export interface InitI18nParams {
  lng?: 'en' | 'he';
}

function initI18n(params: InitI18nParams = {}): typeof i18n {
  const { lng } = params;

  if (!i18n.isInitialized) {
    i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: lng ?? 'en',
        fallbackLng: 'en',
        supportedLngs: ['en', 'he'],
        ns: ['translation'],
        defaultNS: 'translation',
        interpolation: { escapeValue: false },
        returnNull: false,
        returnEmptyString: false,
        load: 'currentOnly',
        react: { useSuspense: false },
      })
      .catch((error) => {
        console.error('i18n init error', error);
      });

    // Sync Day.js locale with i18n on init
    dayjs.locale(lng ?? 'en');
  } else {
    if (lng) {
      i18n.changeLanguage(lng).catch((error) => {
        console.error('i18n changeLanguage error', error);
      });
      // Sync Day.js locale with i18n on language change
      dayjs.locale(lng);
    }
  }

  return i18n;
}

export { i18n, resources, initI18n };
