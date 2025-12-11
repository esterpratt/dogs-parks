import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

export interface InitI18nParams {
  lng?: 'en' | 'he' | 'ar';
}

function initI18n(params: InitI18nParams = {}): typeof i18n {
  const { lng } = params;

  if (!i18n.isInitialized) {
    i18n
      .use(HttpBackend)
      .use(initReactI18next)
      .init({
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
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
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

export { i18n, initI18n };
