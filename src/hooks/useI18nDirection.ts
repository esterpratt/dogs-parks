import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { deriveAppLanguage, isRTL } from '../utils/language';

function useI18nDirection(): void {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = deriveAppLanguage(i18n.language);
    const dir = isRTL(i18n.language) ? 'rtl' : 'ltr';
    const html = document.documentElement;

    html.setAttribute('lang', lang);
    html.setAttribute('dir', dir);

    html.classList.toggle('rtl', dir === 'rtl');
    html.classList.toggle('ltr', dir === 'ltr');
  }, [i18n.language]);
}

export { useI18nDirection };
