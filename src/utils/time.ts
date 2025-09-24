// DEPRECATED MODULE: All functions now live in dateUtils / useDateUtils hook.
// Keep thin wrappers for transition; remove after callers are migrated.
import {
  getFormattedPastDate as coreGetFormattedPastDate,
  getFormattedDateISO,
  getAge as coreGetAge,
  getDurationFromNow as coreGetDurationFromNow,
} from './date.ts';
import { i18n } from '../i18n';
import { deriveAppLanguage } from './language';

const warned: Record<string, boolean> = {};
function warnOnce(name: string) {
  if (!warned[name]) {
    // eslint-disable-next-line no-console
    console.warn(
      `utils/time.${name} is deprecated. Use useDateUtils() or dateUtils instead.`
    );
    warned[name] = true;
  }
}

const getFormattedPastDate = (date?: Date) => {
  warnOnce('getFormattedPastDate');
  const locale = deriveAppLanguage(i18n.language);
  return coreGetFormattedPastDate(date, locale);
};

const getFormattedDate = (date: Date) => {
  warnOnce('getFormattedDate');
  return getFormattedDateISO(date);
};

const getAge = (birthday: Date) => {
  warnOnce('getAge');
  return coreGetAge(birthday);
};

const getDurationFromNow = (ms: number) => {
  warnOnce('getDurationFromNow');
  const locale = deriveAppLanguage(i18n.language);
  return coreGetDurationFromNow(ms, locale);
};

export { getFormattedPastDate, getFormattedDate, getAge, getDurationFromNow };
