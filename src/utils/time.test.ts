import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  getFormattedPastDate,
  getFormattedDate,
  getAge,
  getDurationFromNow,
} from './time';

describe('getFormattedPastDate', () => {
  it('returns N/A if no date is provided', () => {
    expect(getFormattedPastDate()).toBe('N/A');
  });

  it('returns a relative time for recent dates', () => {
    const now = new Date();
    const aFewSecondsAgo = new Date(now.getTime() - 5000);
    const result = getFormattedPastDate(aFewSecondsAgo);
    expect(result).toMatch(/ago$/);
  });

  it('returns DD/MM/YYYY for dates older than 31 days', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 40);
    const result = getFormattedPastDate(oldDate);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('getFormattedDate', () => {
  it('returns YYYY-MM-DD format', () => {
    const date = new Date('2023-01-15T00:00:00Z');
    expect(getFormattedDate(date)).toBe('2023-01-15');
  });
});

describe('getAge', () => {
  it('returns years if at least 1 year old', () => {
    const birthday = new Date();
    birthday.setFullYear(birthday.getFullYear() - 2);
    const age = getAge(birthday);
    expect(age.unit).toBe('years');
    expect(age.diff).toBe(2);
  });

  it('returns months if less than 1 year old', () => {
    const birthday = dayjs().subtract(6, 'month').toDate();
    const age = getAge(birthday);
    expect(age.unit).toBe('months');
    expect(age.diff).toBe(6);
  });

  it('returns 1 month for a birthday exactly 1 month ago', () => {
    const base = dayjs().date(15);
    const birthday = base.subtract(1, 'month').toDate();
    const age = getAge(birthday);
    expect(age.unit).toBe('month');
    expect(age.diff).toBe(1);
  });

  it('returns 11 months for a birthday exactly 11 months ago', () => {
    const base = dayjs().date(15);
    const birthday = base.subtract(11, 'month').toDate();
    const age = getAge(birthday);
    expect(age.unit).toBe('months');
    expect(age.diff).toBe(11);
  });

  it('returns 1 year for a birthday exactly 12 months ago', () => {
    const base = dayjs().date(15);
    const birthday = base.subtract(12, 'month').toDate();
    const age = getAge(birthday);
    expect(age.unit).toBe('year');
    expect(age.diff).toBe(1);
  });
});

describe('getDurationFromNow', () => {
  it('returns a human readable duration', () => {
    const result = getDurationFromNow(1000 * 60 * 60 * 2); // 2 hours
    expect(typeof result).toBe('string');
    expect(result).toMatch(/hour|minute|second/);
  });
});
