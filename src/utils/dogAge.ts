import { GENDER } from '../types/dog';
import { getAge } from './date.ts';
import { resolveDualForm } from './dualForm';

interface GetLocalizedDogAgeTextParams {
  birthday?: string | Date | null;
  gender: GENDER | null | undefined;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Returns a localized age string for a dog, using gender-specific keys when available.
 * Falls back to generic keys if gender or specific keys are not present.
 */
function getLocalizedDogAgeText(
  params: GetLocalizedDogAgeTextParams
): string | null {
  const { birthday, gender, t } = params;

  if (!birthday) {
    return null;
  }

  const dateObj = birthday instanceof Date ? birthday : new Date(birthday);
  const age = getAge(dateObj);

  if (age === null) {
    return null;
  }

  // Just born case
  if (age.diff === 0) {
    if (gender === GENDER.FEMALE) {
      return t('dogs.age.justBornFemale');
    }
    if (gender === GENDER.MALE) {
      return t('dogs.age.justBornMale');
    }
    return t('dogs.age.justBorn');
  }

  // Normalize unit base (year/years -> year, month/months -> month)
  const baseUnit = age.unit.startsWith('year')
    ? 'year'
    : age.unit.startsWith('month')
      ? 'month'
      : age.unit;
  const localizedUnit = t(`dogs.age.units.${age.unit}`);

  // Special-case: singular year in Hebrew (and allow locale-specific phrasing via keys)
  if (age.diff === 1 && baseUnit === 'year') {
    if (gender === GENDER.FEMALE) {
      return t('dogs.age.oldFemaleSingularYear');
    }
    if (gender === GENDER.MALE) {
      return t('dogs.age.oldMaleSingularYear');
    }
    return t('dogs.age.oldSingularYear');
  }

  // Special-case: singular month handling
  if (age.diff === 1 && baseUnit === 'month') {
    if (gender === GENDER.FEMALE) {
      return t('dogs.age.oldFemaleSingularMonth');
    }
    if (gender === GENDER.MALE) {
      return t('dogs.age.oldMaleSingularMonth');
    }
    return t('dogs.age.oldSingularMonth');
  }

  // Generic dual-form resolution (diff === 2) using grammar metadata
  const dualResolved = resolveDualForm({
    diff: age.diff,
    baseUnit,
    gender: gender ?? undefined,
    t,
    includeGenderPrefix: true,
  });

  if (dualResolved) {
    return dualResolved;
  }

  // Positive diff (regular age)
  if (age.diff > 0) {
    if (gender === GENDER.FEMALE) {
      return t('dogs.age.oldFemale', { diff: age.diff, unit: localizedUnit });
    }
    if (gender === GENDER.MALE) {
      return t('dogs.age.oldMale', { diff: age.diff, unit: localizedUnit });
    }
    return t('dogs.age.old', { diff: age.diff, unit: localizedUnit });
  }

  // Compliment branch (negative diff per existing logic) - gender specific
  if (gender === GENDER.FEMALE) {
    return t('dogs.age.oldComplimentFemale', {
      diff: age.diff,
      unit: localizedUnit,
    });
  }

  if (gender === GENDER.MALE) {
    return t('dogs.age.oldComplimentMale', {
      diff: age.diff,
      unit: localizedUnit,
    });
  }

  return t('dogs.age.oldCompliment', {
    diff: age.diff,
    unit: localizedUnit,
    pronoun: t('dogs.age.he'),
  });
}

export { getLocalizedDogAgeText };
