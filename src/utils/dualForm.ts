import { GENDER } from '../types/dog';

export interface ResolveDualFormParams {
  diff: number;
  baseUnit: string;
  gender?: GENDER | null;
  t: (key: string, options?: Record<string, unknown>) => string;
  includeGenderPrefix?: boolean;
}

/**
 * Resolves a dual-form unit phrase (diff === 2) using grammar metadata from locale files.
 * Returns null if not applicable so caller can fall back to standard plural path.
 */
export function resolveDualForm(params: ResolveDualFormParams): string | null {
  const { diff, baseUnit, gender, t, includeGenderPrefix = true } = params;

  if (diff !== 2) {
    return null;
  }

  // Config-driven toggle: if locale chooses not to omit number, skip dual-form replacement
  const config = t('grammar.config', { returnObjects: true }) as unknown;
  const dualConfig = (config as Record<string, unknown>) || {};
  const omitsNumber = Boolean(
    (dualConfig as Record<string, unknown>).dualFormOmitsNumber
  );

  if (!omitsNumber) {
    return null;
  }

  const dualUnits = t('grammar.dualUnits', { returnObjects: true }) as unknown;

  if (!dualUnits || typeof dualUnits !== 'object') {
    return null;
  }

  const unitMap = dualUnits as Record<string, string>;
  const dualUnit = unitMap[baseUnit];

  if (!dualUnit) {
    return null;
  }

  if (!includeGenderPrefix) {
    return dualUnit;
  }

  const genderPrefixes = t('grammar.genderPrefixes', {
    returnObjects: true,
  }) as unknown;

  if (!genderPrefixes || typeof genderPrefixes !== 'object') {
    return null;
  }

  const prefixMap = genderPrefixes as Record<string, string>;

  let prefix: string | undefined;

  if (gender === GENDER.MALE) {
    prefix = prefixMap.male;
  } else if (gender === GENDER.FEMALE) {
    prefix = prefixMap.female;
  } else {
    prefix = prefixMap.neutral;
  }

  if (!prefix) {
    return dualUnit;
  }

  return `${prefix} ${dualUnit}`;
}
