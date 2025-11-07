import { useMemo } from 'react';
import { useAppLocale } from '../hooks/useAppLocale';
import {
  getFormattedPastDate as getFormattedPastDateInternal,
  getFormattedDateISO,
  formatAbsoluteDate as formatAbsoluteDateInternal,
  getAge,
  getDurationFromNow as getDurationFromNowInternal,
  formatFutureCalendar as formatFutureCalendarInternal,
  type AgeResult,
  type FormatDateOptions,
} from '../utils/date.ts';

function useDateUtils() {
  const locale = useAppLocale();

  return useMemo(() => {
    return {
      getFormattedPastDate(date?: Date) {
        return getFormattedPastDateInternal(date, locale);
      },
      formatAbsoluteDate(date: Date, opts?: FormatDateOptions) {
        return formatAbsoluteDateInternal(date, locale, opts);
      },
      formatFutureCalendar(date: Date | string) {
        return formatFutureCalendarInternal(date, locale);
      },
      getDurationFromNow(ms: number) {
        return getDurationFromNowInternal(ms, locale);
      },
      getFormattedDateISO(date: Date) {
        return getFormattedDateISO(date);
      },
      getAge(birthday: Date): AgeResult {
        return getAge(birthday);
      },
    };
  }, [locale]);
}

export { useDateUtils };
