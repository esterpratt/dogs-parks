import { describe, it, expect } from 'vitest';
import { resolveDualForm } from './dualForm';
import { GENDER } from '../types/dog';

function makeT(locale: 'en' | 'he') {
  const data = {
    en: {
      grammar: {
        genderPrefixes: { male: 'male', female: 'female', neutral: 'neutral' },
        dualUnits: { year: '2 years', month: '2 months' },
        config: { dualFormOmitsNumber: false },
      },
    },
    he: {
      grammar: {
        genderPrefixes: { male: 'בן', female: 'בת', neutral: 'בן/בת' },
        dualUnits: { year: 'שנתיים', month: 'חודשיים' },
        config: { dualFormOmitsNumber: true },
      },
    },
  } as const;

  return (key: string, options?: Record<string, unknown>) => {
    const parts = key.split('.');
    let cur: unknown = data[locale];
    for (const p of parts) {
      if (
        cur &&
        typeof cur === 'object' &&
        p in (cur as Record<string, unknown>)
      ) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        cur = undefined;
        break;
      }
    }
    if (options?.returnObjects) {
      return cur as Record<string, unknown>;
    }
    return String(cur ?? '');
  };
}

describe('resolveDualForm', () => {
  it('returns null for non-2 diffs', () => {
    const t = makeT('he');
    const res = resolveDualForm({
      diff: 3,
      baseUnit: 'year',
      t: t as unknown as (
        key: string,
        options?: Record<string, unknown>
      ) => string,
      gender: GENDER.MALE,
    });
    expect(res).toBeNull();
  });

  it('returns null when locale does not omit number (en)', () => {
    const t = makeT('en');
    const res = resolveDualForm({
      diff: 2,
      baseUnit: 'year',
      t: t as unknown as (
        key: string,
        options?: Record<string, unknown>
      ) => string,
      gender: GENDER.MALE,
    });
    expect(res).toBeNull();
  });

  it('returns Hebrew dual form with gender prefix when configured', () => {
    const t = makeT('he');
    const resMale = resolveDualForm({
      diff: 2,
      baseUnit: 'year',
      t: t as unknown as (
        key: string,
        options?: Record<string, unknown>
      ) => string,
      gender: GENDER.MALE,
      includeGenderPrefix: true,
    });
    expect(resMale).toBe('בן שנתיים');

    const resFemale = resolveDualForm({
      diff: 2,
      baseUnit: 'month',
      t: t as unknown as (
        key: string,
        options?: Record<string, unknown>
      ) => string,
      gender: GENDER.FEMALE,
      includeGenderPrefix: true,
    });
    expect(resFemale).toBe('בת חודשיים');
  });

  it('returns dual unit without prefix when includeGenderPrefix=false', () => {
    const t = makeT('he');
    const res = resolveDualForm({
      diff: 2,
      baseUnit: 'year',
      t: t as unknown as (
        key: string,
        options?: Record<string, unknown>
      ) => string,
      includeGenderPrefix: false,
    });
    expect(res).toBe('שנתיים');
  });
});
