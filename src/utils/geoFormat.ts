import { i18n } from '../i18n';
import type { AppLanguage } from '../types/language';
import { deriveAppLanguage } from './language';
import { APP_LANGUAGES } from './consts';

interface FormatDistanceParams {
  km: number | string;
  maximumFractionDigits?: number;
}

interface TravelDurationParts {
  hours: number;
  minutes: number;
}

interface FormatTravelDurationParams {
  seconds: number;
}

function getCurrentLanguage(): AppLanguage {
  return deriveAppLanguage(i18n.language);
}

function formatDistanceKmForLocale(
  params: FormatDistanceParams,
  locale: AppLanguage
): string {
  const { km, maximumFractionDigits = 1 } = params;
  const numericKm = typeof km === 'string' ? parseFloat(km) : km;
  const formatter = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'short',
    maximumFractionDigits,
  });
  // Some locales may already append symbol; fallback to manual suffix for he if needed
  const formatted = formatter.format(numericKm);
  if (
    locale === APP_LANGUAGES.HE &&
    !formatted.includes('ק"מ') &&
    !formatted.includes('קמ')
  ) {
    return `${numericKm.toFixed(maximumFractionDigits)} ק"מ`;
  }
  return formatted;
}

function formatDistanceKm(params: FormatDistanceParams): string {
  const locale = getCurrentLanguage();
  return formatDistanceKmForLocale(params, locale);
}

function splitDuration(secondsTotal: number): TravelDurationParts {
  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.round((secondsTotal % 3600) / 60);
  return { hours, minutes };
}

function formatTravelDurationSecondsForLocale(
  params: FormatTravelDurationParams,
  locale: AppLanguage
): string {
  const { seconds } = params;
  const { hours, minutes } = splitDuration(seconds);

  if (hours === 0) {
    if (locale === APP_LANGUAGES.HE) {
      return `${minutes} דק'`;
    }
    if (locale === APP_LANGUAGES.AR) {
      return `${minutes} دقيقة`;
    }
    return `${minutes} min`;
  }

  if (minutes === 0) {
    if (locale === APP_LANGUAGES.HE) {
      if (hours === 1) {
        return 'שעה';
      }
      return `${hours} ש'`;
    }
    if (locale === APP_LANGUAGES.AR) {
      if (hours === 1) {
        return 'ساعة';
      }
      return `${hours} ساعة`;
    }
    return `${hours}h`;
  }

  if (locale === APP_LANGUAGES.HE) {
    if (hours === 1) {
      return `שעה ו- ${minutes} דק'`;
    }
    return `${hours} ש' ו- ${minutes} דק'`;
  }
  if (locale === APP_LANGUAGES.AR) {
    if (hours === 1) {
      return `ساعة و ${minutes} دقيقة`;
    }
    return `${hours} ساعة و ${minutes} دقيقة`;
  }
  return `${hours}h ${minutes}m`;
}

function formatTravelDurationSeconds(
  params: FormatTravelDurationParams
): string {
  const locale = getCurrentLanguage();
  return formatTravelDurationSecondsForLocale(params, locale);
}

export type { FormatDistanceParams, FormatTravelDurationParams };
export {
  formatDistanceKm,
  formatTravelDurationSeconds,
  formatDistanceKmForLocale,
  formatTravelDurationSecondsForLocale,
};
