import { describe, it, expect } from 'vitest';
import {
  getAge,
  getFormattedDateISO,
  formatAbsoluteDate,
  getFormattedPastDate,
  getDurationFromNow,
} from './date.ts';

describe('date.ts utils', () => {
  it('getAge returns exact months diff and unit for 1 and 6 months', () => {
    const d1 = new Date();
    d1.setMonth(d1.getMonth() - 1);
    const age1 = getAge(d1);
    expect(age1).toEqual({ diff: 1, unit: 'month' });

    const d6 = new Date();
    d6.setMonth(d6.getMonth() - 6);
    const age6 = getAge(d6);
    expect(age6).toEqual({ diff: 6, unit: 'months' });
  });

  it('getAge returns exact years diff and unit for 1 and 2 years', () => {
    const d1y = new Date();
    d1y.setFullYear(d1y.getFullYear() - 1);
    const age1y = getAge(d1y);
    expect(age1y).toEqual({ diff: 1, unit: 'year' });

    const d2y = new Date();
    d2y.setFullYear(d2y.getFullYear() - 2);
    const age2y = getAge(d2y);
    expect(age2y).toEqual({ diff: 2, unit: 'years' });
  });

  it('getFormattedDateISO formats YYYY-MM-DD', () => {
    const d = new Date('2025-01-15T12:34:56Z');
    expect(getFormattedDateISO(d)).toBe('2025-01-15');
  });

  it('formatAbsoluteDate returns locale-shaped short date (en: digits with separators, he: likely dots/slashes)', () => {
    const d = new Date('2025-01-15T12:34:56Z');
    const en = formatAbsoluteDate(d, 'en', { dateStyle: 'short' });
    const he = formatAbsoluteDate(d, 'he', { dateStyle: 'short' });
    // ICU may vary between 2- or 4-digit year and separators; enforce shape not words
    expect(en).toMatch(/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/);
    expect(he).toMatch(/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/);
  });

  it('getFormattedPastDate returns relative strings for < 31 days (exact for 10 days ago)', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    expect(getFormattedPastDate(tenDaysAgo, 'en')).toBe('10 days ago');
    expect(getFormattedPastDate(tenDaysAgo, 'he')).toBe('לפני 10 ימים');
  });

  it('getFormattedPastDate uses locale fomraatted for > 31 days', () => {
    const d = new Date('2024-01-01T00:00:00Z');
    const en = getFormattedPastDate(d, 'en');
    const he = getFormattedPastDate(d, 'he');
    expect(en).toBe('1/1/24');
    expect(he).toBe('1.1.2024');
  });

  it('getFormattedPastDate returns N/A if no date is provided (legacy parity)', () => {
    // default locale is 'en'
    expect(getFormattedPastDate()).toBe('N/A');
  });

  it('getFormattedPastDate returns a relative string for recent dates (legacy parity)', () => {
    const now = new Date();
    const aFewSecondsAgo = new Date(now.getTime() - 5000);
    const result = getFormattedPastDate(aFewSecondsAgo); // default 'en'
    expect(result).toMatch(/ago$/);
  });

  it('getDurationFromNow returns exact strings for specific durations', () => {
    // 2 hours
    expect(getDurationFromNow(2 * 3600_000, 'en')).toBe('2 hours');
    // Hebrew output for 2 hours may be "שעתיים" (not "2 שעות"); accept both to match dayjs locale
    expect(getDurationFromNow(2 * 3600_000, 'he')).toMatch(/^(שעתיים|2 שעות)$/);

    // 10 days
    expect(getDurationFromNow(10 * 24 * 3600_000, 'en')).toBe('10 days');
    expect(getDurationFromNow(10 * 24 * 3600_000, 'he')).toBe('10 ימים');

    // 2 minutes
    expect(getDurationFromNow(2 * 60_000, 'en')).toBe('2 minutes');
    expect(getDurationFromNow(2 * 60_000, 'he')).toBe('2 דקות');
  });

  it('getDurationFromNow returns a human readable string (legacy parity)', () => {
    const result = getDurationFromNow(2 * 3600_000, 'en');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/hour|minute|second/);
  });

  it('getAge returns 11 months and 12 months boundary like legacy tests', () => {
    const m11 = new Date();
    m11.setMonth(m11.getMonth() - 11);
    expect(getAge(m11)).toEqual({ diff: 11, unit: 'months' });

    const m12 = new Date();
    m12.setMonth(m12.getMonth() - 12);
    expect(getAge(m12)).toEqual({ diff: 1, unit: 'year' });
  });
});
