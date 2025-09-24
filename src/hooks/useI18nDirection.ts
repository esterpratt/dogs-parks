import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '../types/language';
import { APP_LANGUAGES } from '../utils/consts';
import { deriveAppLanguage } from '../utils/language';

const RTL_LANGS = new Set<AppLanguage>([APP_LANGUAGES.HE]);

function useI18nDirection(): void {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang: AppLanguage = deriveAppLanguage(i18n.language);
    const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    const html = document.documentElement;

    html.setAttribute('lang', lang);
    html.setAttribute('dir', dir);

    // optional: set a css class for easier styling
    html.classList.toggle('rtl', dir === 'rtl');
    html.classList.toggle('ltr', dir === 'ltr');
  }, [i18n.language]);
}

export { useI18nDirection };
