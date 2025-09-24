import {
  Construction,
  DropletOff,
  LockKeyhole,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { ParkCondition } from '../types/parkCondition';

interface ParkConditionDef {
  id: ParkCondition;
  key: string;
  icon: LucideIcon;
}

export const PARK_CONDITIONS: readonly ParkConditionDef[] = [
  {
    id: ParkCondition.MUDDY,
    key: 'parks.conditions.labels.muddy',
    icon: Waves,
  },
  {
    id: ParkCondition.GATE_CLOSED,
    key: 'parks.conditions.labels.gateClosed',
    icon: LockKeyhole,
  },
  {
    id: ParkCondition.UNDER_CONSTRUCTION,
    key: 'parks.conditions.labels.underConstruction',
    icon: Construction,
  },
  {
    id: ParkCondition.BROKEN_FOUNTAIN,
    key: 'parks.conditions.labels.brokenFountain',
    icon: DropletOff,
  },
];

export type { ParkConditionDef };
