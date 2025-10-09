import { describe, it, expect } from 'vitest';
import { getLocalizedDogAgeText } from './dogAge';
import { GENDER } from '../types/dog';

// Translator mocks
const tEn = (key: string, options?: Record<string, unknown>): string => {
  if (
    key === 'dogs.age.justBornFemale' ||
    key === 'dogs.age.justBornMale' ||
    key === 'dogs.age.justBorn'
  ) {
    return 'Just born';
  }
  if (key === 'dogs.age.units.year') {
    return 'year';
  }
  if (key === 'dogs.age.units.years') {
    return 'years';
  }
  if (key === 'dogs.age.units.month') {
    return 'month';
  }
  if (key === 'dogs.age.units.months') {
    return 'months';
  }
  if (key.startsWith('dogs.age.old')) {
    const diff = (options?.diff ?? '') as string | number;
    const unit = (options?.unit ?? '') as string;
    return `${diff} ${unit}`.trim();
  }
  if (key === 'grammar.config') {
    return JSON.stringify({}); // returnObjects ignored here, dual not used for en
  }
  if (key === 'grammar.dualUnits' || key === 'grammar.genderPrefixes') {
    return JSON.stringify({});
  }
  return key;
};

const tHe = (key: string, options?: Record<string, unknown>): string => {
  if (
    key === 'dogs.age.justBornFemale' ||
    key === 'dogs.age.justBornMale' ||
    key === 'dogs.age.justBorn'
  ) {
    return 'נולד עכשיו';
  }
  if (key.startsWith('dogs.age.old')) {
    const diff = (options?.diff ?? '') as string | number;
    const unit = (options?.unit ?? '') as string;
    return `${diff} ${unit}`.trim();
  }
  if (key === 'dogs.age.units.year') {
    return 'שנה';
  }
  if (key === 'dogs.age.units.years') {
    return 'שנים';
  }
  if (key === 'dogs.age.units.month') {
    return 'חודש';
  }
  if (key === 'dogs.age.units.months') {
    return 'חודשים';
  }
  if (key === 'grammar.config') {
    // Hebrew uses dual form without number for 2
    return { dualFormOmitsNumber: true } as unknown as string;
  }
  if (key === 'grammar.dualUnits') {
    return { year: 'שנתיים', month: 'חודשיים' } as unknown as string;
  }
  if (key === 'grammar.genderPrefixes') {
    return { male: 'בן', female: 'בת', neutral: 'בגיל' } as unknown as string;
  }
  return key;
};

describe('dogAge', () => {
  it('handles just born (0 years)', () => {
    const text = getLocalizedDogAgeText({
      birthday: new Date(),
      gender: GENDER.MALE,
      t: tEn,
    });
    expect(text).toBe('Just born');
  });

  it('handles months (<1 year)', () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const text = getLocalizedDogAgeText({
      birthday: sixMonthsAgo,
      gender: GENDER.FEMALE,
      t: tEn,
    });
    expect(text).toBe('6 months');
  });

  it('handles years (>=1 year) generic', () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const text = getLocalizedDogAgeText({
      birthday: threeYearsAgo,
      gender: undefined,
      t: tEn,
    });
    expect(text).toBe('3 years');
  });

  it('supports Hebrew dual form when applicable (2 years)', () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const text = getLocalizedDogAgeText({
      birthday: twoYearsAgo,
      gender: GENDER.MALE,
      t: tHe,
    });
    // With our mock, dual-form with gender prefix should be: 'בן שנתיים'
    expect(text).toBe('בן שנתיים');
  });
});
