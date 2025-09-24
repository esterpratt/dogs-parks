import { describe, it, expect } from 'vitest';
import {
  formatDistanceKmForLocale,
  formatTravelDurationSecondsForLocale,
} from './geoFormat';

describe('geoFormat', () => {
  it('formats distance in km for en and he', () => {
    const en = formatDistanceKmForLocale(
      { km: 1.5, maximumFractionDigits: 1 },
      'en'
    );
    const he = formatDistanceKmForLocale(
      { km: 1.5, maximumFractionDigits: 1 },
      'he'
    );
    expect(en).toBe('1.5 km');
    expect(he).toBe('1.5 ק"מ');
  });

  it('formats duration minutes only (0h Xm)', () => {
    const en = formatTravelDurationSecondsForLocale({ seconds: 5 * 60 }, 'en');
    const he = formatTravelDurationSecondsForLocale({ seconds: 5 * 60 }, 'he');
    expect(en).toBe('5 min');
    expect(he).toBe("5 דק'");
  });

  it('formats duration hours only (Xh) and Hebrew 1h -> שעה', () => {
    const en1 = formatTravelDurationSecondsForLocale(
      { seconds: 1 * 3600 },
      'en'
    );
    const he1 = formatTravelDurationSecondsForLocale(
      { seconds: 1 * 3600 },
      'he'
    );
    expect(en1).toBe('1h');
    expect(he1).toBe('שעה');

    const en2 = formatTravelDurationSecondsForLocale(
      { seconds: 2 * 3600 },
      'en'
    );
    const he2 = formatTravelDurationSecondsForLocale(
      { seconds: 2 * 3600 },
      'he'
    );
    expect(en2).toBe('2h');
    expect(he2).toBe("2 ש'");
  });

  it('formats duration hours+minutes; Hebrew 1h Xm -> שעה ו- Xm', () => {
    const en = formatTravelDurationSecondsForLocale(
      { seconds: 1 * 3600 + 30 * 60 },
      'en'
    );
    const he = formatTravelDurationSecondsForLocale(
      { seconds: 1 * 3600 + 30 * 60 },
      'he'
    );
    expect(en).toBe('1h 30m');
    expect(he).toBe("שעה ו- 30 דק'");
  });

  it('formats duration hours+minutes multi-hour; Hebrew uses hours shorthand and minutes', () => {
    const en = formatTravelDurationSecondsForLocale(
      { seconds: 2 * 3600 + 15 * 60 },
      'en'
    );
    const he = formatTravelDurationSecondsForLocale(
      { seconds: 2 * 3600 + 15 * 60 },
      'he'
    );
    expect(en).toBe('2h 15m');
    expect(he).toBe("2 ש' ו- 15 דק'");
  });
});
