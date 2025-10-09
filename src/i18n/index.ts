import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import he from './locales/he.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  he: { translation: he },
  ar: { translation: ar },
} as const;

export interface InitI18nParams {
  lng?: 'en' | 'he' | 'ar';
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
        supportedLngs: ['en', 'he', 'ar'],
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
  } else {
    if (lng) {
      i18n.changeLanguage(lng).catch((error) => {
        console.error('i18n changeLanguage error', error);
      });
    }
  }

  return i18n;
}

export { i18n, resources, initI18n };
