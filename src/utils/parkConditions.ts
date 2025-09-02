import { Construction, DropletOff, LockKeyhole, Waves } from 'lucide-react';
import { ParkCondition } from '../types/parkCondition';

export const PARK_CONDITIONS = [
  {
    id: ParkCondition.MUDDY,
    value: 'Muddy',
    icon: Waves,
  },
  {
    id: ParkCondition.GATE_CLOSED,
    value: 'Gate closed',
    icon: LockKeyhole,
  },
  {
    id: ParkCondition.UNDER_CONSTRUCTION,
    value: 'Under construction',
    icon: Construction,
  },
  {
    id: ParkCondition.BROKEN_FOUNTAIN,
    value: 'Broken fountain',
    icon: DropletOff,
  },
];
