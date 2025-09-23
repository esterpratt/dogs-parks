import { Construction, DropletOff, LockKeyhole, Waves } from 'lucide-react';
import { ParkCondition } from '../types/parkCondition';
import i18next from 'i18next';

export const PARK_CONDITIONS = [
  {
    id: ParkCondition.MUDDY,
    get value() {
      return i18next.t('parks.conditions.labels.muddy');
    },
    icon: Waves,
  },
  {
    id: ParkCondition.GATE_CLOSED,
    get value() {
      return i18next.t('parks.conditions.labels.gateClosed');
    },
    icon: LockKeyhole,
  },
  {
    id: ParkCondition.UNDER_CONSTRUCTION,
    get value() {
      return i18next.t('parks.conditions.labels.underConstruction');
    },
    icon: Construction,
  },
  {
    id: ParkCondition.BROKEN_FOUNTAIN,
    get value() {
      return i18next.t('parks.conditions.labels.brokenFountain');
    },
    icon: DropletOff,
  },
];
