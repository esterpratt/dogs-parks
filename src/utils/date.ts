import { dayjs } from '../services/dayjs-setup';
import type { AppLanguage } from '../types/language';

interface AgeResult {
  diff: number;
  unit: 'year' | 'years' | 'month' | 'months';
}

interface FormatDateOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
}

function getFormattedPastDate(
  date?: Date | string,
  locale: AppLanguage = 'en'
): string {
  if (!date) {
    return 'N/A';
  }

  const now = dayjs();
  const target = dayjs(date);
  const diffDays = now.diff(target, 'day');

  if (diffDays < 31) {
    return target.locale(locale).subtract(1, 'second').fromNow();
  }

  return formatAbsoluteDate(date, locale, { dateStyle: 'short' });
}

function getFormattedDateISO(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

function formatAbsoluteDate(
  date: Date | string,
  locale: AppLanguage = 'en',
  opts: FormatDateOptions = { dateStyle: 'medium' }
): string {
  const formatter = new Intl.DateTimeFormat(locale, opts);
  return formatter.format(typeof date === 'string' ? new Date(date) : date);
}

function formatFutureCalendar(date: Date | string, locale: AppLanguage) {
  return dayjs(date).locale(locale).calendar(date);
}

function getAge(birthday: Date): AgeResult {
  const now = dayjs();
  const born = dayjs(birthday);

  const years = now.diff(born, 'year');
  if (years > 0) {
    return { diff: years, unit: years === 1 ? 'year' : 'years' };
  }

  const months = now.diff(born, 'month');
  return { diff: months, unit: months === 1 ? 'month' : 'months' };
}

function getDurationFromNow(ms: number, locale: AppLanguage = 'en'): string {
  const now = new Date();
  const inFuture = new Date(Date.now() + ms);
  return dayjs(now).locale(locale).to(inFuture, true);
}

export type { AgeResult, FormatDateOptions };
export {
  getFormattedPastDate,
  getFormattedDateISO,
  formatAbsoluteDate,
  getAge,
  getDurationFromNow,
  formatFutureCalendar,
};
