import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { AppLanguage } from '../types/language';
import { deriveAppLanguage } from '../utils/language';

function useAppLocale(): AppLanguage {
  const { i18n } = useTranslation();
  const base = useMemo(
    () => deriveAppLanguage(i18n.resolvedLanguage || i18n.language),
    [i18n.resolvedLanguage, i18n.language]
  );
  return base;
}

export { useAppLocale };
